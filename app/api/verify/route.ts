import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { AuthError, verifySupabaseAuth } from '@/lib/auth-middleware'
import { extractTokenLookupFromQR } from '@/lib/qr-utils'

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}

// Verify and scan a token
export async function POST(request: NextRequest) {
  try {
    await verifySupabaseAuth(request, ['staff', 'admin'])
    const supabase = getSupabaseAdminClient()
    const { qrCode, counterId } = await request.json()
    const { tokenLookup } = extractTokenLookupFromQR(String(qrCode || ''))

    if (!tokenLookup || !counterId) {
      return NextResponse.json(
        { error: 'QR code and counter ID required' },
        { status: 400 }
      )
    }

    // Find token by QR code or backup code
    let { data: token, error: tokenError } = await supabase
      .from('meal_tokens')
      .select('*')
      .or(`qr_code.eq.${tokenLookup},backup_code.eq.${tokenLookup}`)
      .single()

    if (tokenError && String(tokenError.message || '').toLowerCase().includes('backup_code')) {
      const fallback = await supabase
        .from('meal_tokens')
        .select('*')
        .eq('qr_code', tokenLookup)
        .single()
      token = fallback.data
      tokenError = fallback.error
    }

    if (tokenError || !token) {
      if (tokenError) {
        console.error('DB ERROR:', tokenError)
      }
      return NextResponse.json(
        { error: 'Invalid QR code' },
        { status: 404 }
      )
    }

    // Check if token is still valid
    const now = new Date()
    const nowMs = now.getTime()
    const expiresAtMs = new Date(token.expires_at).getTime()

    if (token.status !== 'VALID') {
      return NextResponse.json(
        { 
          error: `Token is ${token.status}`,
          status: token.status 
        },
        { status: 400 }
      )
    }

    if (Number.isFinite(expiresAtMs) && nowMs > expiresAtMs) {
      // Update token status to expired
      const { error: expireError } = await supabase
        .from('meal_tokens')
        .update({ status: 'EXPIRED' })
        .eq('id', token.id)

      if (expireError) {
        console.error('DB ERROR:', expireError)
        return NextResponse.json({ error: expireError.message }, { status: 500 })
      }

      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      )
    }

    // Update token as used
    const { data: updatedToken, error: updateError } = await supabase
      .from('meal_tokens')
      .update({
        status: 'USED',
        scanned_at: now.toISOString(),
        counter_id: counterId
      })
      .eq('id', token.id)
      .eq('status', 'VALID')
      .select()
      .single()

    if (updateError) {
      // Conditional update can fail when token was consumed in a concurrent scan.
      if (String(updateError.code || '').toUpperCase() === 'PGRST116') {
        return NextResponse.json(
          { error: 'Token already scanned', status: 'USED' },
          { status: 409 }
        )
      }
      console.error('DB ERROR:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Get student details
    const { data: student } = await supabase
      .from('students')
      .select('*, users(name, email)')
      .eq('id', updatedToken.student_id)
      .single()

    // Log the verification in audit logs
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        action: 'TOKEN_SCANNED',
        user_id: student?.user_id,
        details: {
          token_id: updatedToken.id,
          counter_id: counterId,
          meal_type: updatedToken.meal_type
        }
      })

    if (auditError) {
      console.error('DB ERROR:', auditError)
      return NextResponse.json({ error: auditError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      token: updatedToken,
      student: student,
      message: 'Token verified successfully'
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[v0] Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
