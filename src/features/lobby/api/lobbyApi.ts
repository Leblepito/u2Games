// Centralized, fail-loud Supabase client. Keeps env validation in one place
// instead of duplicating the silent-null guard here — see src/lib/supabase.
import { getSupabase } from "@/lib/supabase";

export interface LobbyRecord {
  id: string;
  code: string;
  hostName: string;
  createdAt: string;
}

interface CreateLobbyPayload {
  hostName: string;
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
