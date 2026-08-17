'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Grilla: 16 columnas x 14 filas de 40px (640x560). Fila 0 = arriba (metas).
const COLS = 16;
const ROWS = 14;
const CELL = 40;
const W = COLS * CELL;
const H = ROWS * CELL;

// Zonas (índice de fila, 0 = arriba)
const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_SAFE_MID = 7;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

const JUMP_ANIM_MS = 120;
const ROUND_TIME_MS = 15_000;
const ROUND_TIME_STEP_MS = 1_000;
const ROUND_TIME_FLOOR_MS = 6_000;
const LEVEL_SPEED_STEP = 1.15;

const GOAL_SLOT_COLS = [1, 4, 7, 10, 13]; // columna izquierda de cada boca (ancho 2)
const TURTLE_VISIBLE_MS = 3_000;
const TURTLE_SUBMERGED_MS = 1_500;

export type FroggerState = {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
};

export type FroggerProps = {
  paused: boolean;
  onStateChange: (state: FroggerState) => void;
};

export type FroggerHandle = {
  forceGameOver: () => void;
  restart: () => void;
};

type Direction = 'up' | 'down' | 'left' | 'right';

type EntityType = 'car' | 'truck' | 'log' | 'turtle';

type Entity = {
  col: number; // posición horizontal en unidades de columna (continua)
  width: number; // en columnas
  type: EntityType;
  submerged?: boolean; // solo turtle
  submergeAcc?: number; // ms acumulados en el ciclo de inmersión (solo turtle)
};

type Lane = {
  row: number;
  speed: number; // columnas por segundo
  dir: 1 | -1;
  entities: Entity[];
};

type Frog = {
  col: number;
  row: number;
  animating: boolean;
  animT: number;
  fromCol: number;
  fromRow: number;
  targetCol: number;
  targetRow: number;
};

type GameStatus = 'playing' | 'gameover';

type Game = {
  frog: Frog;
  pendingDir: Direction | null;
  roadLanes: Lane[];
  riverLanes: Lane[];
  goalsFilled: boolean[]; // 5 bocas
  lives: number;
  score: number;
  level: number;
  maxRowThisTrip: number;
  roundTimeMs: number; // duración total de ronda para el nivel actual
  timeRemainingMs: number;
  status: GameStatus;
};

const Frogger = forwardRef<FroggerHandle, FroggerProps>(function Frogger(
  { paused, onStateChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(paused);
  const onStateChangeRef = useRef(onStateChange);
  pausedRef.current = paused;
  onStateChangeRef.current = onStateChange;

  useImperativeHandle(ref, () => ({
    forceGameOver() {},
    restart() {},
  }));

  useEffect(() => {
    // Placeholder: implementado en pasos siguientes del plan.
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
});

Frogger.displayName = 'Frogger';

export default Frogger;
