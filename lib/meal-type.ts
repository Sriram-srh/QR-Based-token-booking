export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'] as const

export type MealType = (typeof MEAL_TYPES)[number]

export function normalizeMealType(input: unknown): MealType | null {
  if (typeof input !== 'string') {
    return null
  }

  const normalized = input.trim().toLowerCase()
  if (normalized === 'breakfast') return 'Breakfast'
  if (normalized === 'lunch') return 'Lunch'
  if (normalized === 'dinner') return 'Dinner'
  return null
}
