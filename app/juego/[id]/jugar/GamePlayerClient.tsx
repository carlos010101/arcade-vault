'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Game } from '@/lib/games';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/lib/session-context';
import Asteroids, {
  type AsteroidsHandle,
  type AsteroidsState,
} from '@/components/games/Asteroids';
import Tetris, {
  type TetrisHandle,
  type TetrisState,
} from '@/components/games/Tetris';

export default function GamePlayerClient({ game }: { game: Game }) {
  const router = useRouter();
  const { user } = useSession();
  const isAsteroids = game.id === 'asteroids';
  const isTetris = game.id === 'tetris';
  const gameRef = useRef<AsteroidsHandle>(null);
  const tetrisGameRef = useRef<TetrisHandle>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [asteroidsLevel, setAsteroidsLevel] = useState(1);
  const [tetrisLines, setTetrisLines] = useState(0);
  const [tetrisLevel, setTetrisLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(user ? user.name : 'INVITADO');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const level = isAsteroids
    ? asteroidsLevel
    : isTetris
      ? tetrisLevel
      : 1 + Math.floor(score / 2500);

  useEffect(() => {
    if (over || paused || isAsteroids || isTetris) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220,
    );
    return () => clearInterval(t);
  }, [over, paused, isAsteroids, isTetris]);

  const handleAsteroidsStateChange = (s: AsteroidsState) => {
    setScore(s.score);
    setLives(s.lives);
    setAsteroidsLevel(s.level);
    if (s.gameOver) setOver(true);
  };

  const handleTetrisStateChange = (s: TetrisState) => {
    setScore(s.score);
    setTetrisLines(s.lines);
    setTetrisLevel(s.level);
    if (s.gameOver) setOver(true);
  };

  const endGame = () => {
    if (isAsteroids) {
      gameRef.current?.forceGameOver();
    } else if (isTetris) {
      tetrisGameRef.current?.forceGameOver();
    } else {
      setOver(true);
    }
  };
  const restart = () => {
    if (isAsteroids) gameRef.current?.restart();
    if (isTetris) tetrisGameRef.current?.restart();
    setScore(0);
    setLives(3);
    setAsteroidsLevel(1);
    setTetrisLines(0);
    setTetrisLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setSaveError(null);
  };

  const handleSaveScore = async () => {
    if (!isAsteroids && !isTetris) {
      setSaved(true);
      return;
    }
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    const { error } = await supabase.from('scores').insert({
      game_id: isTetris ? 'tetris' : 'asteroids',
      player_name: name,
      score,
    });
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    setSaved(true);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: 'var(--ink)' }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString('es-ES')}</div>
          </div>
          {isTetris ? (
            <div className="hud-stat">
              <div className="l">Líneas</div>
              <div className="v">{tetrisLines}</div>
            </div>
          ) : (
            <div className="hud-stat lives">
              <div className="l">Vidas</div>
              <div className="v">{'♥ '.repeat(lives).trim() || '—'}</div>
            </div>
          )}
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, '0')}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? 'REANUDAR' : 'PAUSA'}
          </button>
          <button className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <Link href={`/juego/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {isAsteroids ? (
            <Asteroids
              ref={gameRef}
              paused={paused}
              onStateChange={handleAsteroidsStateChange}
            />
          ) : isTetris ? (
            <Tetris
              ref={tetrisGameRef}
              paused={paused}
              onStateChange={handleTetrisStateChange}
            />
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {paused && (
            <div
              className="crt-content"
              style={{ background: 'rgba(0,0,0,0.6)', zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-dim)',
                    marginTop: 10,
                    letterSpacing: '0.16em',
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString('es-ES')}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                />
                <button
                  className="btn yellow"
                  onClick={handleSaveScore}
                  disabled={saving}
                >
                  {saving ? 'GUARDANDO…' : 'GUARDAR PUNTUACIÓN'}
                </button>
                {saveError && (
                  <div
                    className="mono"
                    style={{
                      color: 'var(--magenta)',
                      fontSize: 11,
                      marginTop: 8,
                    }}
                  >
                    {saveError}
                  </div>
                )}
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <button
                className="btn magenta"
                onClick={() => router.push('/biblioteca')}
              >
                VOLVER AL VAULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
