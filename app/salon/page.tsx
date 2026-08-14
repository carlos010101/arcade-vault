import { getGames, getTopScores } from '@/lib/games';
import SalonClient from './SalonClient';

export default async function HallOfFamePage() {
  const [games, asteroidsScores] = await Promise.all([
    getGames(),
    getTopScores('asteroids', 12),
  ]);

  return <SalonClient games={games} asteroidsScores={asteroidsScores} />;
}
