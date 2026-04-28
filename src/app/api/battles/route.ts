import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Lom energy cycle — Water beats Fire, Fire beats Wind, etc.
const LOM_CYCLE: Record<string, string> = {
  water: 'fire', fire: 'wind', wind: 'earth', earth: 'spirit', spirit: 'water',
}

function getLomMultiplier(attackLom: string, defenseLom: string): number {
  return LOM_CYCLE[attackLom] === defenseLom ? 1.5 : 1.0
}

function computeBattle(attacker: Record<string, unknown>, defender: Record<string, unknown>) {
  const aStats = attacker.stats as Record<string, number>
  const dStats = defender.stats as Record<string, number>
  const aLom = (attacker.lom_type as string) ?? 'spirit'
  const dLom = (defender.lom_type as string) ?? 'spirit'

  const attackPower = (aStats.attack ?? 50) * getLomMultiplier(aLom, dLom)
  const defense = dStats.defense ?? 40
  const won = attackPower > defense

  return {
    winner_id: won ? attacker.id : defender.id,
    coins_earned: won ? 50 : 10,
    xp_earned: won ? 100 : 25,
    lom_bonus: getLomMultiplier(aLom, dLom) > 1,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('player_id')
  if (!playerId) return NextResponse.json({ error: 'player_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rv_battle_results')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { attacker_id, defender_id, player_id, coins_wagered, chapter_id } = await request.json()

  const supabase = await createClient()

  // Fetch both roosters
  const { data: roosters, error: rErr } = await supabase
    .from('rv_roosters')
    .select('*')
    .in('id', [attacker_id, defender_id])

  if (rErr || !roosters || roosters.length < 2) {
    return NextResponse.json({ error: 'Could not fetch roosters' }, { status: 400 })
  }

  const attacker = roosters.find((r) => r.id === attacker_id)!
  const defender = roosters.find((r) => r.id === defender_id)!
  const result = computeBattle(attacker, defender)
  const won = result.winner_id === attacker_id

  // Persist result
  const { error: insertErr } = await supabase.from('rv_battle_results').insert({
    player_id,
    rooster_id: attacker_id,
    opponent_data: { id: defender.id, name: defender.name, stats: defender.stats },
    won,
    coins_wagered: coins_wagered ?? 0,
    coins_earned: result.coins_earned,
    xp_earned: result.xp_earned,
    chapter_id: chapter_id ?? null,
    stats: { lom_bonus: result.lom_bonus },
  })

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  // Update rooster wins/losses
  await supabase
    .from('rv_roosters')
    .update({ wins: attacker.wins + (won ? 1 : 0), losses: attacker.losses + (won ? 0 : 1) })
    .eq('id', attacker_id)

  // Update user coins
  const coinDelta = won
    ? result.coins_earned + (coins_wagered ?? 0)
    : -(coins_wagered ?? 0)

  await supabase.rpc('increment_coins', { user_id: player_id, amount: coinDelta })

  return NextResponse.json({ ...result, won })
}
