import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BREEDING_COST = 200 // RC

export async function POST(request: Request) {
  const { user_id, rooster_a_id, rooster_b_id } = await request.json()
  const supabase = await createClient()

  // Check wallet
  const { data: user } = await supabase
    .from('rv_users')
    .select('rooster_coins')
    .eq('id', user_id)
    .single()

  if (!user || user.rooster_coins < BREEDING_COST) {
    return NextResponse.json({ error: `Need ${BREEDING_COST} RC to breed` }, { status: 400 })
  }

  // Get parents
  const { data: parents } = await supabase
    .from('rv_roosters')
    .select('*')
    .in('id', [rooster_a_id, rooster_b_id])

  if (!parents || parents.length < 2) {
    return NextResponse.json({ error: 'Parent roosters not found' }, { status: 400 })
  }

  const [a, b] = parents
  const aStats = a.stats as Record<string, number>
  const bStats = b.stats as Record<string, number>

  // Inherit stats (average + small random bonus)
  const childStats = {
    attack: Math.round((aStats.attack + bStats.attack) / 2 + Math.random() * 10),
    defense: Math.round((aStats.defense + bStats.defense) / 2 + Math.random() * 10),
    speed: Math.round((aStats.speed + bStats.speed) / 2 + Math.random() * 10),
    stamina: Math.round((aStats.stamina + bStats.stamina) / 2 + Math.random() * 10),
  }

  const lomOptions = ['water', 'fire', 'wind', 'earth', 'spirit']
  const childLom = lomOptions[Math.floor(Math.random() * lomOptions.length)]

  // Deduct RC
  await supabase.rpc('increment_coins', { user_id, amount: -BREEDING_COST })

  // Create offspring
  const { data: child, error } = await supabase
    .from('rv_roosters')
    .insert({
      owner_id: user_id,
      name: `${a.name}×${b.name} Jr.`,
      stats: childStats,
      style: a.style,
      lom_type: childLom,
      power_rating: Math.round(Object.values(childStats).reduce((s, v) => s + v, 0) / 4),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ child, cost: BREEDING_COST }, { status: 201 })
}
