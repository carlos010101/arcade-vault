import { getGames } from '@/lib/games';
import BibliotecaClient from './BibliotecaClient';

export default async function Biblioteca() {
  const games = await getGames();

  return <BibliotecaClient games={games} />;
}
