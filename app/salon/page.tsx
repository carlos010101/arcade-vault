import { getGames, getTopScores } from '@/lib/games';
import SalonClient from './SalonClient';

export default async function HallOfFamePage() {
  const [games, asteroidsScores, tetrisScores, arkanoidScores, snakeScores] =
    await Promise.all([
      getGames(),
      getTopScores('asteroids', 12),
      getTopScores('tetris', 12),
      getTopScores('arkanoid', 12),
      getTopScores('snake', 12),
    ]);

  return (
    <SalonClient
      games={games}
      asteroidsScores={asteroidsScores}
      tetrisScores={tetrisScores}
      arkanoidScores={arkanoidScores}
      snakeScores={snakeScores}
    />
  );
}
