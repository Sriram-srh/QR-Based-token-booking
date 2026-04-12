import { getSupabaseAdminClient } from "@/lib/db-service"
import { AuthError, requireRole } from "@/lib/auth-middleware"

export const dynamic = 'force-dynamic'

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

/**
 * PATCH /api/meals/[id]
 * 
 * Admin updates meal properties and menu mappings.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(request, 'admin')
    const { id: mealId } = await params

    // 🔥 SAFETY CHECK: Validate mealId is not empty or undefined
    console.log(`\n🔥 [api/meals] PATCH params:`, { params, mealId, mealIdType: typeof mealId })

    if (!mealId || mealId === 'undefined' || mealId === '') {
      console.error(`🔥 [api/meals] SAFETY CHECK FAILED: Invalid mealId`)
      console.error(`   mealId value: "${mealId}"`)
      console.error(`   mealId type: ${typeof mealId}`)
      return Response.json(
        { 
          success: false, 
          error: 'mealId is required and must be a valid UUID',
          receivedMealId: mealId
        },
        { status: 400 }
      )
    }

    console.log(`\n🔥 [api/meals/${mealId}] PATCH request started`)

    const rawBody = await request.text()
    if (!rawBody || rawBody.trim() === '') {
      return Response.json(
        { success: false, error: 'Empty request body' },
        { status: 400 }
      )
    }

    let body: Record<string, any>
    try {
      body = JSON.parse(rawBody) as Record<string, any>
    } catch (parseError) {
      return Response.json(
        {
          success: false,
          error: 'Invalid JSON body',
          details: parseError instanceof Error ? parseError.message : String(parseError)
        },
        { status: 400 }
      )
    }

    console.log(`[api/meals/${mealId}] Request body:`, body)
    
    const supabase = getSupabaseAdminClient()
    console.log(`[api/meals/${mealId}] Supabase client initialized`)
    
    const updateData: Record<string, any> = {}
    if (typeof body.is_open === 'boolean') {
      updateData.is_open = body.is_open
    }
    if (typeof body.meal_date === 'string' && body.meal_date) {
      updateData.meal_date = body.meal_date
    }
    if (typeof body.max_quota === 'number') {
      updateData.max_quota = body.max_quota
    }

    if (Object.keys(updateData).length === 0 && !Array.isArray(body.menu_items)) {
      return Response.json(
        {
          success: false,
          error: 'No valid fields provided. Expected one of: is_open, meal_date, max_quota, menu_items',
        },
        { status: 400 }
      )
    }

    updateData.updated_at = new Date().toISOString()
    
    console.log(`[api/meals/${mealId}] About to execute update with:`, updateData)
    
    const { data: updatedMeal, error } = await (supabase
      .from('meals') as any)
      .update(updateData)
      .eq('id', mealId)
      .select('*')
      .single()
    
    console.log(`[api/meals/${mealId}] Supabase response:`, { updatedMeal, error })
    
    // ✅ DETAILED ERROR LOGGING
    if (error) {
      console.error(`🔥 [api/meals/${mealId}] DB ERROR (CRITICAL):`)
      console.error(`  Code: ${error.code}`)
      console.error(`  Message: ${error.message}`)
      console.error(`  Details: ${error.details}`)
      console.error(`  Hint: ${error.hint}`)
      console.error(`  Full object:`, JSON.stringify(error, null, 2))
      
      return Response.json(
        { 
          success: false, 
          error: error.message || 'Database update failed',
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      )
    }
    
    if (!updatedMeal) {
      console.warn(`⚠️ [api/meals/${mealId}] Meal not found after update`)
      return Response.json(
        { success: false, error: 'Meal not found' },
        { status: 404 }
      )
    }

    const incomingItems = Array.isArray(body.menu_items) ? body.menu_items : []
    if (incomingItems.length > 0) {
      for (const item of incomingItems) {
        let menuItemId = String(item?.id || '')

        if (!isUuid(menuItemId)) {
          const { data: insertedItem, error: insertItemError } = await (supabase
            .from('menu_items') as any)
            .insert({
              name: String(item?.name || 'Menu Item'),
              cost: Number(item?.cost || 0),
              max_quantity: Number(item?.maxQuantity || 1),
              is_active: true,
            })
            .select('id')
            .single()

          if (insertItemError || !insertedItem?.id) {
            console.error(`[api/meals/${mealId}] Failed to insert menu item`, insertItemError)
            continue
          }

          menuItemId = insertedItem.id
        } else {
          const { error: updateItemError } = await (supabase
            .from('menu_items') as any)
            .update({
              name: String(item?.name || 'Menu Item'),
              cost: Number(item?.cost || 0),
              max_quantity: Number(item?.maxQuantity || 1),
              updated_at: new Date().toISOString(),
            })
            .eq('id', menuItemId)

          if (updateItemError) {
            return Response.json(
              {
                success: false,
                error: updateItemError.message || 'Failed to update menu item',
                code: updateItemError.code,
                details: updateItemError.details,
                hint: updateItemError.hint,
              },
              { status: 500 }
            )
          }
        }

        const linkPayload = {
          meal_id: mealId,
          menu_item_id: menuItemId,
          quantity_limit: Number(item?.maxQuantity || 1),
        }

        const linkResult = await (supabase
          .from('meal_menu_items') as any)
          .upsert(linkPayload, { onConflict: 'meal_id,menu_item_id' })

        if (linkResult.error && /quantity_limit/i.test(String(linkResult.error.message || ''))) {
          const { error: fallbackLinkError } = await (supabase
            .from('meal_menu_items') as any)
            .upsert(
              {
                meal_id: mealId,
                menu_item_id: menuItemId,
              },
              { onConflict: 'meal_id,menu_item_id' }
            )

          if (fallbackLinkError) {
            return Response.json(
              {
                success: false,
                error: fallbackLinkError.message || 'Failed to upsert meal_menu_items mapping',
                code: fallbackLinkError.code,
                details: fallbackLinkError.details,
                hint: fallbackLinkError.hint,
              },
              { status: 500 }
            )
          }
        } else if (linkResult.error) {
          return Response.json(
            {
              success: false,
              error: linkResult.error.message || 'Failed to upsert meal_menu_items mapping',
              code: linkResult.error.code,
              details: linkResult.error.details,
              hint: linkResult.error.hint,
            },
            { status: 500 }
          )
        }
      }
    }
    
    console.log(`✅ [api/meals/${mealId}] Toggle success:`, {
      id: (updatedMeal as any).id,
      is_open: (updatedMeal as any).is_open
    })
    
    return Response.json({
      success: true,
      data: updatedMeal
    })
    
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json({ success: false, error: err.message }, { status: err.status })
    }
    console.error(`🔥 [api/meals] PATCH EXCEPTION (unexpected crash):`)
    console.error(`  Type: ${err instanceof Error ? 'Error' : typeof err}`)
    console.error(`  Message: ${err instanceof Error ? err.message : String(err)}`)
    console.error(`  Stack: ${err instanceof Error ? err.stack : 'N/A'}`)
    console.error(`  Full error:`, err)
    
    return Response.json(
      { 
        success: false, 
        error: err instanceof Error ? err.message : String(err),
        type: typeof err,
        details: String(err)
      },
      { status: 500 }
    )
  }
}
