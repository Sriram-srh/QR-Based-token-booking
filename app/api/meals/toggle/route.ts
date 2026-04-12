import { getSupabaseAdminClient } from "@/lib/db-service"
import { NextResponse } from "next/server"
import { verifyAuth, AuthError } from '@/lib/auth-middleware'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * POST /api/meals/toggle
 * 
 * Admin toggles meal is_open status
 * Input: { mealId: string, isOpen: boolean }
 * Output: { success: true } or { error: string, ... }
 */
export async function POST(request: Request) {
  console.log("\n[POST /api/meals/toggle] request received")
  
  try {
    verifyAuth(request, ['admin'])
    const rawBody = await request.text()
    console.log("Raw body:", rawBody)

    if (!rawBody || rawBody.trim() === "") {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      )
    }

    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }

    console.log("Body parsed:", JSON.stringify(body, null, 2))
    
    const parsed = z.object({
      mealId: z.string().uuid(),
      isOpen: z.boolean(),
    }).safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { mealId, isOpen } = parsed.data

    console.log("Extracted fields:", { mealId, isOpen, mealIdType: typeof mealId })

    console.log("All fields present, connecting to Supabase...")
    const supabase = getSupabaseAdminClient()
    
    console.log(`Updating meals table: SET is_open = ${isOpen} WHERE id = ${mealId}`)
    const { data, error } = await (supabase
      .from('meals') as any)
      .update({ is_open: isOpen })
      .eq('id', mealId)
      .select('*')

    console.log("Supabase response:", { data, error: error ? JSON.stringify(error) : null })

    if (error) {
      console.error("DB error:", JSON.stringify(error, null, 2))
      const errorResponse = {
        error: error.message || "Database error",
        code: error.code,
        details: error.details,
        hint: error.hint
      }
      console.log("Returning error response:", errorResponse)
      return NextResponse.json(errorResponse, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.warn("No rows were updated - meal not found")
      const errorResponse = { error: "Meal not found or already in that state" }
      console.log("Returning error response:", errorResponse)
      return NextResponse.json(errorResponse, { status: 404 })
    }

    console.log("API success: meal toggled", { mealId, isOpen, updatedRows: data.length })
    const successResponse = { success: true, data: data[0] }
    console.log("Returning success response:", successResponse)
    return NextResponse.json(successResponse, { status: 200 })

  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error("API crash:", err)
    const errorMsg = err instanceof Error ? err.message : String(err)
    const errorResponse = { error: errorMsg }
    console.log("Returning crash error response:", errorResponse)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
