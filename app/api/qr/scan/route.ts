import { NextRequest, NextResponse } from 'next/server';
import { validateAndScanToken, getStudentInfo, logAuditEvent } from '@/lib/db-service';
import { AuthError, verifySupabaseAuth } from '@/lib/auth-middleware';

function mapFailureReasonToStatus(reason?: string): number {
  if (reason === 'INVALID_QR_FORMAT' || reason === 'INVALID') return 400;
  if (reason === 'ALREADY_USED') return 409;
  if (reason === 'EXPIRED' || reason === 'CANCELLED') return 410;
  return 500;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifySupabaseAuth(request, ['staff', 'admin']);
    const body = await request.json();
    const { qrCode, counterId, staffId } = body;

    // Validate required fields
    if (!qrCode || !counterId) {
      return NextResponse.json(
        { error: 'Missing required fields: qrCode, counterId' },
        { status: 400 }
      );
    }

    if (user.role === 'staff' && !user.staffId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'staff' && staffId && user.staffId && staffId !== user.staffId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate and scan the token
    const scanResult = await validateAndScanToken(qrCode, counterId);

    if (!scanResult.success) {
      // Log failed scan attempt
      await logAuditEvent(
        'QR_SCAN_FAILED',
        user.role === 'staff' ? user.staffId || staffId || null : staffId || null,
        'staff',
        {
          qrCode,
          counterId,
          error: scanResult.error,
        }
      );

      return NextResponse.json(
        {
          success: false,
          reason: scanResult.reason || 'INTERNAL_ERROR',
          error: scanResult.error,
          tokenId: scanResult.tokenId,
          studentId: scanResult.studentId,
          mealType: scanResult.mealType,
          status: scanResult.status,
        },
        { status: mapFailureReasonToStatus(scanResult.reason) }
      );
    }

    // Get student info for verification
    const studentInfo: any = await getStudentInfo(scanResult.studentId || '');

    // Log successful scan
    await logAuditEvent(
      'QR_SCAN_SUCCESS',
      user.role === 'staff' ? user.staffId || staffId || null : staffId || null,
      'staff',
      {
        tokenId: scanResult.tokenId,
        studentId: scanResult.studentId,
        mealType: scanResult.mealType,
        counterId,
      }
    );

    return NextResponse.json({
      success: true,
      token: {
        id: scanResult.tokenId,
        studentId: scanResult.studentId,
        mealType: scanResult.mealType,
        status: scanResult.status,
        expiresAt: scanResult.expiresAt,
      },
      student: studentInfo ? {
        id: studentInfo.id,
        name: studentInfo.users?.name,
        registerNumber: studentInfo.register_number,
        hostel: studentInfo.hostel,
        room: studentInfo.room,
        photo: studentInfo.photo_url,
      } : null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[v0] Error scanning QR code:', error);
    return NextResponse.json(
      { error: 'Failed to scan QR code' },
      { status: 500 }
    );
  }
}
