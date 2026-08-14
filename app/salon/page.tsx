import { getGames, getTopScores } from '@/lib/games';
import SalonClient from './SalonClient';

export default async function HallOfFamePage() {
  const [games, asteroidsScores, tetrisScores] = await Promise.all([
    getGames(),
    getTopScores('asteroids', 12),
    getTopScores('tetris', 12),
  ]);

  return (
    <SalonClient
      games={games}
      asteroidsScores={asteroidsScores}
      tetrisScores={tetrisScores}
    />
  );
}
