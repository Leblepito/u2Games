import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface LobbyRecord {
  id: string;
  code: string;
  hostName: string;
  createdAt: string;
}

interface CreateLobbyPayload {
  hostName: string;
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  return createClient(url, anonKey);
}

export async function createLobby(payload: CreateLobbyPayload): Promise<LobbyRecord | null> {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const { data, error } = await supabase
    .from("lobbies")
    .insert({ code, host_name: payload.hostName })
    .select("id, code, host_name, created_at")
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: String(data.id),
    code: String(data.code),
    hostName: String(data.host_name),
    createdAt: String(data.created_at),
  };
}

export async function getLobbyByCode(code: string): Promise<LobbyRecord | null> {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("lobbies")
    .select("id, code, host_name, created_at")
    .eq("code", code.toUpperCase())
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: String(data.id),
    code: String(data.code),
    hostName: String(data.host_name),
    createdAt: String(data.created_at),
  };
}
