import { NextRequest, NextResponse } from 'next/server';
import { generateQRCodeDataUrl, generateQRCodeBuffer, createQRCodeId, getTokenExpirationTime } from '@/lib/qr-utils';
import { createMealToken, logAuditEvent } from '@/lib/db-service';
import { verifySupabaseAuth, AuthError } from '@/lib/auth-middleware';
import { normalizeMealType } from '@/lib/meal-type';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    await verifySupabaseAuth(request, ['admin', 'staff']);
    const body = await request.json();
    const parsed = z.object({
      studentId: z.string().uuid(),
      mealType: z.string(),
      totalCost: z.number(),
      counterId: z.string().uuid().nullable().optional(),
      items: z.array(z.any()).optional(),
    }).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const { studentId, totalCost, counterId } = parsed.data;
    const mealType = normalizeMealType(parsed.data.mealType);

    if (!mealType) {
      return NextResponse.json(
        { error: 'Invalid meal type. Use Breakfast, Lunch, or Dinner.' },
        { status: 400 }
      );
    }

    // Create unique QR code ID
    const qrCodeId = createQRCodeId(studentId, mealType, Date.now());
    const expiresAt = getTokenExpirationTime(1 / 60); // 60 seconds

    // Generate QR data
    const qrData = {
      tokenId: qrCodeId,
    };

    // Generate QR code as data URL
    const qrCodeDataUrl = await generateQRCodeDataUrl(qrData);

    // Create token in database
    const token = await createMealToken(
      studentId,
      mealType,
      qrCodeId,
      qrCodeDataUrl,
      totalCost,
      expiresAt
    );

    if (!token) {
      return NextResponse.json(
        { error: 'Failed to create meal token in database' },
        { status: 500 }
      );
    }

    // Log the event
    await logAuditEvent(
      'QR_CODE_GENERATED',
      null,
      'staff',
      {
        studentId,
        mealType,
        totalCost,
        tokenId: token.id,
        counterId: counterId || null,
      }
    );

    return NextResponse.json({
      success: true,
      token: {
        id: token.id,
        qrCode: token.qr_code,
        backupCode: token.backup_code,
        qrCodeImage: token.qr_code_image,
        mealType: token.meal_type,
        totalCost: token.total_cost,
        expiresAt: token.expires_at,
        createdAt: token.created_at,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[v0] Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
