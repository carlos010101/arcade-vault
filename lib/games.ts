import { createClient } from '@/lib/supabase/server';
import type { ScoreRow } from '@/lib/app-data';

export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: 'ARCADE' | 'PUZZLE' | 'SHOOTER' | 'VERSUS';
  cover: string;
  color: 'cyan' | 'magenta' | 'yellow' | 'green';
  best: number;
  plays: string;
};

export async function getGames(): Promise<Game[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('games').select('*');

  if (error) throw error;

  return data;
}

export async function getGame(id: string): Promise<Game | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getTopScores(
  gameId: string,
  limit = 12,
): Promise<ScoreRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scores')
    .select('player_name, score, created_at')
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map((row, i) => {
    const date = new Date(row.created_at);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return {
      rank: i + 1,
      name: row.player_name,
      score: row.score,
      date: `${day}/${month}/${year}`,
    };
  });
}
