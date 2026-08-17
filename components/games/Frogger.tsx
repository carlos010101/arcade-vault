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

// ── Construcción de carriles ─────────────────────────────────────────────
// Config base por carril: tipo de entidad, ancho (columnas), cantidad,
// separación entre entidades (columnas) y velocidad base (columnas/seg).
type LaneSpec = {
  row: number;
  type: EntityType;
  width: number;
  count: number;
  gap: number;
  baseSpeed: number;
  dir: 1 | -1;
};

const ROAD_SPECS: LaneSpec[] = [
  { row: 8, type: 'car', width: 1, count: 4, gap: 3, baseSpeed: 3, dir: 1 },
  { row: 9, type: 'truck', width: 2, count: 3, gap: 4, baseSpeed: 2, dir: -1 },
  { row: 10, type: 'car', width: 1, count: 5, gap: 2.2, baseSpeed: 4, dir: 1 },
  { row: 11, type: 'car', width: 1, count: 4, gap: 3, baseSpeed: 2.5, dir: -1 },
  {
    row: 12,
    type: 'truck',
    width: 3,
    count: 2,
    gap: 5,
    baseSpeed: 1.8,
    dir: 1,
  },
];

const RIVER_SPECS: LaneSpec[] = [
  { row: 1, type: 'log', width: 3, count: 3, gap: 3, baseSpeed: 1.5, dir: 1 },
  {
    row: 2,
    type: 'turtle',
    width: 2,
    count: 3,
    gap: 3.5,
    baseSpeed: 2,
    dir: -1,
  },
  { row: 3, type: 'log', width: 4, count: 2, gap: 4, baseSpeed: 1.2, dir: 1 },
  {
    row: 4,
    type: 'turtle',
    width: 3,
    count: 2,
    gap: 4.5,
    baseSpeed: 1.8,
    dir: -1,
  },
  { row: 5, type: 'log', width: 2, count: 4, gap: 2.5, baseSpeed: 2.5, dir: 1 },
  {
    row: 6,
    type: 'turtle',
    width: 2,
    count: 3,
    gap: 3,
    baseSpeed: 1.6,
    dir: -1,
  },
];

function buildLaneFromSpec(spec: LaneSpec, level: number): Lane {
  const speed = spec.baseSpeed * Math.pow(LEVEL_SPEED_STEP, level - 1);
  const step = spec.width + spec.gap;
  const entities: Entity[] = [];
  for (let i = 0; i < spec.count; i++) {
    entities.push({
      col: i * step,
      width: spec.width,
      type: spec.type,
      submerged: spec.type === 'turtle' ? false : undefined,
      submergeAcc:
        spec.type === 'turtle'
          ? (i * TURTLE_VISIBLE_MS) / spec.count
          : undefined,
    });
  }
  return { row: spec.row, speed, dir: spec.dir, entities };
}

function buildLanes(level: number): { road: Lane[]; river: Lane[] } {
  return {
    road: ROAD_SPECS.map((s) => buildLaneFromSpec(s, level)),
    river: RIVER_SPECS.map((s) => buildLaneFromSpec(s, level)),
  };
}

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

const START_COL = Math.floor((COLS - 1) / 2);

function levelRoundTimeMs(level: number): number {
  return Math.max(
    ROUND_TIME_FLOOR_MS,
    ROUND_TIME_MS - (level - 1) * ROUND_TIME_STEP_MS,
  );
}

function createGame(): Game {
  const lanes = buildLanes(1);
  return {
    frog: {
      col: START_COL,
      row: ROW_START,
      animating: false,
      animT: 0,
      fromCol: START_COL,
      fromRow: ROW_START,
      targetCol: START_COL,
      targetRow: ROW_START,
    },
    pendingDir: null,
    roadLanes: lanes.road,
    riverLanes: lanes.river,
    goalsFilled: [false, false, false, false, false],
    lives: 3,
    score: 0,
    level: 1,
    maxRowThisTrip: ROW_START,
    roundTimeMs: levelRoundTimeMs(1),
    timeRemainingMs: levelRoundTimeMs(1),
    status: 'playing',
  };
}

function respawnFrog(g: Game) {
  g.frog.col = START_COL;
  g.frog.row = ROW_START;
  g.frog.animating = false;
  g.frog.fromCol = START_COL;
  g.frog.fromRow = ROW_START;
  g.frog.targetCol = START_COL;
  g.frog.targetRow = ROW_START;
  g.maxRowThisTrip = ROW_START;
  g.timeRemainingMs = g.roundTimeMs;
}

function killFrog(g: Game) {
  g.lives -= 1;
  if (g.lives <= 0) {
    g.lives = 0;
    g.status = 'gameover';
    return;
  }
  respawnFrog(g);
}

function completeRound(g: Game) {
  g.score += 200;
  g.level += 1;
  g.goalsFilled = [false, false, false, false, false];
  const lanes = buildLanes(g.level);
  g.roadLanes = lanes.road;
  g.riverLanes = lanes.river;
  g.roundTimeMs = levelRoundTimeMs(g.level);
  respawnFrog(g);
}

function advanceLanes(lanes: Lane[], dt: number) {
  for (const lane of lanes) {
    for (const entity of lane.entities) {
      entity.col += (lane.dir * lane.speed * dt) / 1000;
      if (lane.dir === 1 && entity.col > COLS) {
        entity.col = -entity.width;
      } else if (lane.dir === -1 && entity.col + entity.width < 0) {
        entity.col = COLS;
      }
      if (entity.type === 'turtle') {
        entity.submergeAcc = (entity.submergeAcc ?? 0) + dt;
        const cycle = TURTLE_VISIBLE_MS + TURTLE_SUBMERGED_MS;
        const phase = entity.submergeAcc % cycle;
        entity.submerged = phase >= TURTLE_VISIBLE_MS;
      }
    }
  }
}

function overlaps(frogCol: number, entity: Entity): boolean {
  const frogLeft = frogCol;
  const frogRight = frogCol + 1;
  const entLeft = entity.col;
  const entRight = entity.col + entity.width;
  return frogLeft < entRight && frogRight > entLeft;
}

function checkRoadCollision(g: Game): boolean {
  const lane = g.roadLanes.find((l) => l.row === g.frog.row);
  if (!lane) return false;
  return lane.entities.some((e) => overlaps(g.frog.col, e));
}

function getSupport(g: Game): Entity | null {
  const lane = g.riverLanes.find((l) => l.row === g.frog.row);
  if (!lane) return null;
  for (const e of lane.entities) {
    if (overlaps(g.frog.col, e) && !(e.type === 'turtle' && e.submerged)) {
      return e;
    }
  }
  return null;
}

function resolveGoalLanding(g: Game) {
  const col = Math.round(g.frog.col);
  const slotIndex = GOAL_SLOT_COLS.findIndex((c) => col >= c && col < c + 2);
  if (slotIndex === -1 || g.goalsFilled[slotIndex]) {
    killFrog(g);
    return;
  }
  g.goalsFilled[slotIndex] = true;
  g.score += 50 + Math.round(g.timeRemainingMs / 1000) * 10;
  if (g.goalsFilled.every(Boolean)) {
    completeRound(g);
  } else {
    respawnFrog(g);
  }
}

function resolveLanding(g: Game) {
  if (g.frog.row < g.maxRowThisTrip) {
    g.score += 10 * (g.maxRowThisTrip - g.frog.row);
    g.maxRowThisTrip = g.frog.row;
  }

  if (g.frog.row === ROW_GOALS) {
    resolveGoalLanding(g);
    return;
  }
  if (g.frog.row >= ROW_RIVER_TOP && g.frog.row <= ROW_RIVER_BOT) {
    if (!getSupport(g)) killFrog(g);
    return;
  }
  if (g.frog.row >= ROW_ROAD_TOP && g.frog.row <= ROW_ROAD_BOT) {
    if (checkRoadCollision(g)) killFrog(g);
  }
}

function update(g: Game, dt: number) {
  if (g.status !== 'playing') return;

  advanceLanes(g.roadLanes, dt);
  advanceLanes(g.riverLanes, dt);

  if (!g.frog.animating && g.pendingDir) {
    const dir = g.pendingDir;
    g.pendingDir = null;
    let targetCol = Math.round(g.frog.col);
    let targetRow = g.frog.row;
    if (dir === 'up') targetRow -= 1;
    else if (dir === 'down') targetRow += 1;
    else if (dir === 'left') targetCol -= 1;
    else if (dir === 'right') targetCol += 1;
    targetCol = Math.max(0, Math.min(COLS - 1, targetCol));
    targetRow = Math.max(ROW_GOALS, Math.min(ROW_START, targetRow));
    if (targetCol !== g.frog.col || targetRow !== g.frog.row) {
      g.frog.animating = true;
      g.frog.animT = 0;
      g.frog.fromCol = g.frog.col;
      g.frog.fromRow = g.frog.row;
      g.frog.targetCol = targetCol;
      g.frog.targetRow = targetRow;
    }
  }

  if (g.frog.animating) {
    g.frog.animT += dt;
    if (g.frog.animT >= JUMP_ANIM_MS) {
      g.frog.animating = false;
      g.frog.col = g.frog.targetCol;
      g.frog.row = g.frog.targetRow;
      resolveLanding(g);
    } else {
      const t = g.frog.animT / JUMP_ANIM_MS;
      g.frog.col = g.frog.fromCol + (g.frog.targetCol - g.frog.fromCol) * t;
      g.frog.row = g.frog.fromRow + (g.frog.targetRow - g.frog.fromRow) * t;
    }
  } else if (
    g.status === 'playing' &&
    g.frog.row >= ROW_RIVER_TOP &&
    g.frog.row <= ROW_RIVER_BOT
  ) {
    const support = getSupport(g);
    if (!support) {
      killFrog(g);
    } else {
      const lane = g.riverLanes.find((l) => l.row === g.frog.row)!;
      g.frog.col += (lane.dir * lane.speed * dt) / 1000;
      if (g.frog.col < 0 || g.frog.col > COLS - 1) {
        killFrog(g);
      }
    }
  } else if (
    g.status === 'playing' &&
    g.frog.row >= ROW_ROAD_TOP &&
    g.frog.row <= ROW_ROAD_BOT &&
    checkRoadCollision(g)
  ) {
    killFrog(g);
  }

  if (g.status === 'playing') {
    g.timeRemainingMs -= dt;
    if (g.timeRemainingMs <= 0) {
      g.timeRemainingMs = 0;
      killFrog(g);
    }
  }
}

// ── Dibujo ────────────────────────────────────────────────────────────────
function zoneColor(row: number): string {
  if (row === ROW_GOALS) return '#123b1f';
  if (row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT) return '#0a2e4a';
  if (row === ROW_SAFE_MID || row === ROW_START) return '#0f2a12';
  return '#141414'; // carretera
}

function drawEntity(ctx: CanvasRenderingContext2D, row: number, e: Entity) {
  const x = e.col * CELL;
  const y = row * CELL;
  const w = e.width * CELL;
  const h = CELL;

  if (e.type === 'car') {
    ctx.fillStyle = '#e5484d';
    ctx.fillRect(x + 2, y + 6, w - 4, h - 12);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x + 8, y + h - 6, 4, 0, Math.PI * 2);
    ctx.arc(x + w - 8, y + h - 6, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.type === 'truck') {
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(x + 2, y + 4, w - 4, h - 8);
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(x + 2, y + 4, CELL - 6, h - 8);
  } else if (e.type === 'log') {
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(x, y + 6, w, h - 12);
    ctx.strokeStyle = '#5c3a1a';
    ctx.lineWidth = 1;
    for (let i = 1; i < e.width; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * CELL, y + 6);
      ctx.lineTo(x + i * CELL, y + h - 6);
      ctx.stroke();
    }
  } else if (e.type === 'turtle') {
    ctx.globalAlpha = e.submerged ? 0.35 : 1;
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 2, h / 2 - 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawFrog(ctx: CanvasRenderingContext2D, frog: Frog) {
  const x = frog.col * CELL + CELL / 2;
  const y = frog.row * CELL + CELL / 2;
  const legOut = frog.animating ? 4 : 0;
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(x, y, 14 + legOut, 12 + legOut, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - 5, y - 6, 3, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x - 5, y - 6, 1.4, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 6, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

function draw(g: Game, ctx: CanvasRenderingContext2D) {
  for (let r = 0; r < ROWS; r++) {
    ctx.fillStyle = zoneColor(r);
    ctx.fillRect(0, r * CELL, W, CELL);
  }

  GOAL_SLOT_COLS.forEach((c, i) => {
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(c * CELL + 2, 2, 2 * CELL - 4, CELL - 4);
    if (g.goalsFilled[i]) {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(
        c * CELL + CELL,
        CELL / 2,
        CELL / 2 - 6,
        CELL / 2 - 8,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });

  for (const lane of g.roadLanes) {
    for (const e of lane.entities) drawEntity(ctx, lane.row, e);
  }
  for (const lane of g.riverLanes) {
    for (const e of lane.entities) drawEntity(ctx, lane.row, e);
  }

  drawFrog(ctx, g.frog);

  // HUD interno
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`SCORE ${g.score}`, 6, H - 20);
  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${g.level}`, W / 2, H - 20);
  ctx.textAlign = 'right';
  const livesLabel = '●'.repeat(Math.max(0, g.lives));
  ctx.fillStyle = '#22c55e';
  ctx.fillText(livesLabel || '—', W - 6, H - 20);

  const frac = g.roundTimeMs > 0 ? g.timeRemainingMs / g.roundTimeMs : 0;
  const barColor = frac > 0.5 ? '#22c55e' : frac > 0.2 ? '#eab308' : '#ef4444';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, 6);
  ctx.fillStyle = barColor;
  ctx.fillRect(0, 0, W * Math.max(0, frac), 6);

  if (g.status === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', W / 2, H / 2);
  }
}

const Frogger = forwardRef<FroggerHandle, FroggerProps>(function Frogger(
  { paused, onStateChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game>(createGame());
  const pausedRef = useRef(paused);
  const onStateChangeRef = useRef(onStateChange);
  const lastEmittedRef = useRef<FroggerState | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  pausedRef.current = paused;
  onStateChangeRef.current = onStateChange;

  useImperativeHandle(
    ref,
    () => ({
      forceGameOver() {
        gameRef.current.status = 'gameover';
        gameRef.current.lives = 0;
      },
      restart() {
        gameRef.current = createGame();
        lastEmittedRef.current = null;
      },
    }),
    [],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let dir: Direction | null = null;
      if (e.key === 'ArrowUp') dir = 'up';
      else if (e.key === 'ArrowDown') dir = 'down';
      else if (e.key === 'ArrowLeft') dir = 'left';
      else if (e.key === 'ArrowRight') dir = 'right';
      if (!dir) return;
      e.preventDefault();
      gameRef.current.pendingDir = dir;
    };
    window.addEventListener('keydown', handleKeyDown);

    const loop = (ts: number) => {
      const g = gameRef.current;
      const dt =
        lastTimeRef.current === null
          ? 0
          : Math.min(ts - lastTimeRef.current, 50);
      lastTimeRef.current = ts;

      if (!pausedRef.current) update(g, dt);

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) draw(g, ctx);

      const next: FroggerState = {
        score: g.score,
        lives: g.lives,
        level: g.level,
        gameOver: g.status === 'gameover',
      };
      const last = lastEmittedRef.current;
      if (
        !last ||
        last.score !== next.score ||
        last.lives !== next.lives ||
        last.level !== next.level ||
        last.gameOver !== next.gameOver
      ) {
        lastEmittedRef.current = next;
        onStateChangeRef.current(next);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
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
