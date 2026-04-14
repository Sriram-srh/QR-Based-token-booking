import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/db-service'
import { AuthError, requireRoleAsync } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

function isSchemaCacheMissingQuantityLimit(error: any): boolean {
  return (
    error?.code === 'PGRST204' &&
    String(error?.message || '').toLowerCase().includes('quantity_limit')
  )
}

export async function POST(request: Request) {
  try {
    await requireRoleAsync(request, 'admin')
    const body = await request.json()
    console.log("🔥 SAVE API BODY:", JSON.stringify(body, null, 2))

    const { mealId, items } = body

    if (!mealId) {
      return NextResponse.json(
        { error: "mealId missing" },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      )
    }

    const invalidItem = items.find((i: any) => !i?.menu_item_id)
    if (invalidItem) {
      return NextResponse.json(
        { error: "Each item must include menu_item_id" },
        { status: 400 }
      )
    }

    const supabase: any = getSupabaseAdminClient()

    const del = await supabase
      .from('meal_menu_items')
      .delete()
      .eq('meal_id', mealId)

    if (del.error) {
      return NextResponse.json(
        { error: del.error.message },
        { status: 500 }
      )
    }

    const insert = await supabase
      .from('meal_menu_items')
      .insert(
        items.map((i: any) => ({
          meal_id: mealId,
          menu_item_id: i.menu_item_id,
          quantity_limit: i.quantity_limit
        }))
      )

    if (insert.error && isSchemaCacheMissingQuantityLimit(insert.error)) {
      // Fallback when PostgREST schema cache is stale and does not expose quantity_limit yet.
      const fallbackInsert = await supabase
        .from('meal_menu_items')
        .insert(
          items.map((i: any) => ({
            meal_id: mealId,
            menu_item_id: i.menu_item_id,
          }))
        )

      if (fallbackInsert.error) {
        console.error("🔥 INSERT ERROR (fallback):", fallbackInsert.error)
        return NextResponse.json(
          {
            error: fallbackInsert.error.message,
            code: fallbackInsert.error.code,
            details: fallbackInsert.error.details
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        warning: "Saved without quantity_limit because schema cache is stale. Refresh Supabase API cache and retry to persist limits."
      })
    }

    if (insert.error) {
      console.error("🔥 INSERT ERROR:", insert.error)

      return NextResponse.json(
        {
          error: insert.error.message,
          code: insert.error.code,
          details: insert.error.details
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error("🔥 API CRASH:", err)

    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    )
  }
}
