'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import Arkanoid, {
  type ArkanoidHandle,
  type ArkanoidState,
} from '@/components/games/Arkanoid';
import Snake, {
  type SnakeHandle,
  type SnakeState,
} from '@/components/games/Snake';
import Frogger, {
  type FroggerHandle,
  type FroggerState,
} from '@/components/games/Frogger';
import { SKINS, DEFAULT_SKIN, type SkinId } from '@/lib/skins';
import { useIsTouchDevice } from '@/lib/use-touch-device';
import TouchControls from '@/components/TouchControls';
import {
  ASTEROIDS_TOUCH_CONFIG,
  TETRIS_TOUCH_CONFIG,
  ARKANOID_TOUCH_CONFIG,
  SNAKE_TOUCH_CONFIG,
} from '@/lib/touch-configs';

export default function GamePlayerClient({ game }: { game: Game }) {
  const router = useRouter();
  const { user } = useSession();
  const isAsteroids = game.id === 'asteroids';
  const isTetris = game.id === 'tetris';
  const isArkanoid = game.id === 'arkanoid';
  const isSnake = game.id === 'snake';
  const isFrogger = game.id === 'frogger';
  const gameRef = useRef<AsteroidsHandle>(null);
  const tetrisGameRef = useRef<TetrisHandle>(null);
  const arkanoidGameRef = useRef<ArkanoidHandle>(null);
  const snakeGameRef = useRef<SnakeHandle>(null);
  const froggerGameRef = useRef<FroggerHandle>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [asteroidsLevel, setAsteroidsLevel] = useState(1);
  const [tetrisLines, setTetrisLines] = useState(0);
  const [tetrisLevel, setTetrisLevel] = useState(1);
  const [arkanoidLevel, setArkanoidLevel] = useState(1);
  const [snakeLevel, setSnakeLevel] = useState(1);
  const [froggerLevel, setFroggerLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [skin, setSkin] = useState<SkinId>(DEFAULT_SKIN);
  const isTouch = useIsTouchDevice();

  useEffect(() => {
    // Sincroniza el skin persistido para este juego desde localStorage al
    // montar. Se hace en un efecto (no en el render inicial) a propósito,
    // para no provocar un mismatch de hidratación entre servidor y cliente.
    const stored = localStorage.getItem(`av-skin:${game.id}`);
    if (stored === 'clasico' || stored === 'retro' || stored === 'neon') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync único desde localStorage al montar, no re-render en cascada.
      setSkin(stored);
    }
  }, [game.id]);

  useEffect(() => {
    localStorage.setItem(`av-skin:${game.id}`, skin);
  }, [game.id, skin]);

  const level = isAsteroids
    ? asteroidsLevel
    : isTetris
      ? tetrisLevel
      : isArkanoid
        ? arkanoidLevel
        : isSnake
          ? snakeLevel
          : isFrogger
            ? froggerLevel
            : 1 + Math.floor(score / 2500);

  useEffect(() => {
    if (
      over ||
      paused ||
      isAsteroids ||
      isTetris ||
      isArkanoid ||
      isSnake ||
      isFrogger
    )
      return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220,
    );
    return () => clearInterval(t);
  }, [over, paused, isAsteroids, isTetris, isArkanoid, isSnake, isFrogger]);

  // useCallback: deps estables para que React.memo(Asteroids) filtre
  // re-renders del padre (misma fix ya aplicada a Snake).
  const handleAsteroidsStateChange = useCallback((s: AsteroidsState) => {
    setScore(s.score);
    setLives(s.lives);
    setAsteroidsLevel(s.level);
    if (s.gameOver) setOver(true);
  }, []);

  // useCallback: deps estables para que React.memo(Tetris) filtre re-renders
  // del padre (ver auditoría de rendimiento de `tetris`).
  const handleTetrisStateChange = useCallback((s: TetrisState) => {
    setScore(s.score);
    setTetrisLines(s.lines);
    setTetrisLevel(s.level);
    if (s.gameOver) setOver(true);
  }, []);

  // useCallback: deps estables para que React.memo(Arkanoid) filtre
  // re-renders del padre.
  const handleArkanoidStateChange = useCallback((s: ArkanoidState) => {
    setScore(s.score);
    setLives(s.lives);
    setArkanoidLevel(s.level);
    if (s.gameOver) setOver(true);
  }, []);

  // useCallback: deps estables para que React.memo(Snake/Frogger) filtre
  // re-renders del padre.
  const handleSnakeStateChange = useCallback((s: SnakeState) => {
    setScore(s.score);
    setLives(s.lives);
    setSnakeLevel(s.level);
    if (s.gameOver) setOver(true);
  }, []);

  const handleFroggerStateChange = useCallback((s: FroggerState) => {
    setScore(s.score);
    setLives(s.lives);
    setFroggerLevel(s.level);
    if (s.gameOver) setOver(true);
  }, []);

  const endGame = () => {
    if (isAsteroids) {
      gameRef.current?.forceGameOver();
    } else if (isTetris) {
      tetrisGameRef.current?.forceGameOver();
    } else if (isArkanoid) {
      arkanoidGameRef.current?.forceGameOver();
    } else if (isSnake) {
      snakeGameRef.current?.forceGameOver();
    } else if (isFrogger) {
      froggerGameRef.current?.forceGameOver();
    } else {
      setOver(true);
    }
  };
  const restart = () => {
    if (isAsteroids) gameRef.current?.restart();
    if (isTetris) tetrisGameRef.current?.restart();
    if (isArkanoid) arkanoidGameRef.current?.restart();
    if (isSnake) snakeGameRef.current?.restart();
    if (isFrogger) froggerGameRef.current?.restart();
    setScore(0);
    setLives(3);
    setAsteroidsLevel(1);
    setTetrisLines(0);
    setTetrisLevel(1);
    setArkanoidLevel(1);
    setSnakeLevel(1);
    setFroggerLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setSaveError(null);
  };

  const handleSaveScore = async () => {
    if (!user) return;
    if (!isAsteroids && !isTetris && !isArkanoid && !isSnake && !isFrogger) {
      setSaved(true);
      return;
    }
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    const { error } = await supabase.from('scores').insert({
      game_id: isTetris
        ? 'tetris'
        : isArkanoid
          ? 'arkanoid'
          : isAsteroids
            ? 'asteroids'
            : isSnake
              ? 'snake'
              : 'frogger',
      player_name: user.name,
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
              {user ? user.name : 'INVITADO'}
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
          {SKINS.map((s) => (
            <button
              key={s.id}
              className={`btn ${skin === s.id ? 'yellow' : 'ghost'}`}
              style={{ padding: '10px 12px', fontSize: 9 }}
              onClick={() => setSkin(s.id)}
              aria-pressed={skin === s.id}
            >
              {s.label}
            </button>
          ))}
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
              skin={skin}
              onStateChange={handleAsteroidsStateChange}
            />
          ) : isTetris ? (
            <Tetris
              ref={tetrisGameRef}
              paused={paused}
              onStateChange={handleTetrisStateChange}
            />
          ) : isArkanoid ? (
            <Arkanoid
              ref={arkanoidGameRef}
              paused={paused}
              skin={skin}
              onStateChange={handleArkanoidStateChange}
            />
          ) : isSnake ? (
            <Snake
              ref={snakeGameRef}
              paused={paused}
              skin={skin}
              onStateChange={handleSnakeStateChange}
            />
          ) : isFrogger ? (
            <Frogger
              ref={froggerGameRef}
              paused={paused}
              skin={skin}
              onStateChange={handleFroggerStateChange}
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

      {isTouch && (isAsteroids || isTetris || isArkanoid || isSnake) && (
        <TouchControls
          config={
            isAsteroids
              ? ASTEROIDS_TOUCH_CONFIG
              : isTetris
                ? TETRIS_TOUCH_CONFIG
                : isArkanoid
                  ? ARKANOID_TOUCH_CONFIG
                  : SNAKE_TOUCH_CONFIG
          }
        />
      )}

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString('es-ES')}</div>
            {!saved ? (
              user ? (
                <div className="input-row">
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
                <div className="input-row">
                  <div
                    className="mono"
                    style={{
                      color: 'var(--ink-dim)',
                      fontSize: 11,
                    }}
                  >
                    Inicia sesión para guardar tu puntuación
                  </div>
                  <Link href="/auth" className="btn yellow">
                    INICIAR SESIÓN
                  </Link>
                </div>
              )
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
