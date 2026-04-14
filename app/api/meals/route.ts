import { NextRequest } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db-service"
import { AuthError, verifySupabaseAuth } from "@/lib/auth-middleware"

export const dynamic = 'force-dynamic'

/**
 * GET /api/meals
 * 
 * Returns ALL upcoming meals (no is_open filter)
 * Students see all meals - but can only book if is_open = true
 * 
 * Separates VIEW logic (show all) from BOOK logic (check is_open)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifySupabaseAuth(request, ['student', 'admin'])
    console.log('[api/meals] Auth resolved:', { userId: user.userId, role: user.role })

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[api/meals] Missing SUPABASE_SERVICE_ROLE_KEY')
      return Response.json(
        { success: false, error: 'Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      )
    }

    const supabase = getSupabaseAdminClient()
    const view = request.nextUrl.searchParams.get('view') || 'student'
    const nowIso = new Date().toISOString()

    if (user.role === 'student' && view === 'admin') {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]
    
    // Get max date (10 days from today) for admin view
    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + 10)
    const maxDateStr = maxDate.toISOString().split('T')[0]

    const withQuantitySelect = `
      *,
      meal_menu_items (
        quantity_limit,
        menu_items (
          id,
          name,
          cost,
          max_quantity
        )
      )
    `

    const legacySelect = `
      *,
      meal_menu_items (
        menu_items (
          id,
          name,
          cost,
          max_quantity
        )
      )
    `

    let baseQuery = supabase
      .from('meals')
      .select(withQuantitySelect)
      .gte('meal_date', todayStr)
      .order('meal_date', { ascending: true })

    if (view === 'admin') {
      baseQuery = baseQuery.lte('meal_date', maxDateStr)
    }

    if (view === 'student') {
      baseQuery = baseQuery
        .eq('is_open', true)
        .gt('booking_end', nowIso)
    }

    let { data: meals, error } = await baseQuery

    // Backward compatibility: older DBs may not have meal_menu_items.quantity_limit.
    if (error && /quantity_limit/i.test(String(error.message || ''))) {
      let fallbackQuery = supabase
        .from('meals')
        .select(legacySelect)
        .gte('meal_date', todayStr)
        .order('meal_date', { ascending: true })

      if (view === 'admin') {
        fallbackQuery = fallbackQuery.lte('meal_date', maxDateStr)
      }

      if (view === 'student') {
        fallbackQuery = fallbackQuery
          .eq('is_open', true)
          .gt('booking_end', nowIso)
      }

      const fallbackResult = await fallbackQuery
      meals = fallbackResult.data
      error = fallbackResult.error
    }

    // Last-resort fallback: relation/table shape can vary across environments.
    if (error && /meal_menu_items|menu_items/i.test(String(error.message || ''))) {
      let plainQuery = supabase
        .from('meals')
        .select('*')
        .gte('meal_date', todayStr)
        .order('meal_date', { ascending: true })

      if (view === 'admin') {
        plainQuery = plainQuery.lte('meal_date', maxDateStr)
      }

      if (view === 'student') {
        plainQuery = plainQuery
          .eq('is_open', true)
          .gt('booking_end', nowIso)
      }

      const plainResult = await plainQuery
      meals = plainResult.data
      error = plainResult.error
    }

    if (error) {
      console.error('[api/meals] Query error:', error)
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const mealsWithItems = (meals || []).map((meal: any) => {
      const links = Array.isArray(meal.meal_menu_items) ? meal.meal_menu_items : []
      const menuItems = links
        .filter((link: any) => link?.menu_items)
        .map((link: any) => ({
          id: String(link.menu_items.id),
          name: String(link.menu_items.name),
          cost: Number(link.menu_items.cost || 0),
          maxQuantity: Number(link.quantity_limit || link.menu_items.max_quantity || 5),
        }))

      return {
        ...meal,
        menuItems,
      }
    })

    return Response.json({
      success: true,
      data: mealsWithItems,
      count: mealsWithItems.length,
      view,
      window: {
        from: todayStr,
        to: view === 'admin' ? maxDateStr : null
      }
    })
    
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json({ success: false, error: err.message }, { status: err.status })
    }
    console.error('[api/meals] Exception:', err)
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
