import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sortBy = searchParams.get('sort') ?? 'rooster_coins'
  const allowed = ['rooster_coins', 'xp', 'level']
  const column = allowed.includes(sortBy) ? sortBy : 'rooster_coins'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rv_users')
    .select('id, display_name, rooster_coins, xp, level')
    .order(column, { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
