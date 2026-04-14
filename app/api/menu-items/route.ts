import { NextRequest } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db-service"
import { AuthError, requireRoleAsync } from "@/lib/auth-middleware"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireRoleAsync(request, 'admin')
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('menu_items')
      .select('id, name, cost, max_quantity, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('[api/menu-items] Query error:', error)
      return Response.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json({ success: false, error: err.message }, { status: err.status })
    }
    console.error('[api/menu-items] Exception:', err)
    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
