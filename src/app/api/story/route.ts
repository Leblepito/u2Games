import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rv_story_progress')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return default if no row yet
  return NextResponse.json(data ?? {
    user_id: userId,
    season: 1,
    completed_chapters: [],
    unlocked_moves: [],
    collected_facts: [],
    partner_sync_scores: {},
  })
}

export async function POST(request: Request) {
  const { user_id, chapter_id, season } = await request.json()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('rv_story_progress')
    .select('completed_chapters')
    .eq('user_id', user_id)
    .single()

  const completed = existing?.completed_chapters ?? []
  if (!completed.includes(chapter_id)) completed.push(chapter_id)

  const { data, error } = await supabase
    .from('rv_story_progress')
    .upsert({ user_id, season, completed_chapters: completed, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
