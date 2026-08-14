'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const W = 800;
const H = 600;
const CELL = 20;
const COLS = W / CELL;
const ROWS = H / CELL;

const BASE_TICK_MS = 150;
const TICK_STEP_MS = 12;
const MIN_TICK_MS = 50;
const FRUITS_PER_LEVEL = 5;

export type SnakeState = {
  score: number;
  lives: number; // 1 mientras vive, 0 en game over — sin sistema de vidas múltiples
  level: number;
  gameOver: boolean;
};

export type SnakeProps = {
  paused: boolean;
  onStateChange: (state: SnakeState) => void;
};

export type SnakeHandle = {
  forceGameOver: () => void;
  restart: () => void;
};

// ── Spritesheet ──────────────────────────────────────────────────────────
// Recortes portados de references/souce-assets/snake-assets/sprites.js
type SpriteFrame = { x: number; y: number; w: number; h: number };

const FRUIT_SPRITES: SpriteFrame[] = [
  { x: 34, y: 136, w: 110, h: 160 }, // banana
  { x: 186, y: 136, w: 150, h: 160 }, // orange
  { x: 378, y: 136, w: 110, h: 160 }, // grape
  { x: 540, y: 136, w: 130, h: 160 }, // garlic
  { x: 712, y: 136, w: 130, h: 160 }, // eggplant
  { x: 894, y: 136, w: 110, h: 160 }, // strawberry
  { x: 1066, y: 136, w: 110, h: 160 }, // cherry
  { x: 1228, y: 136, w: 130, h: 160 }, // carrot
  { x: 1400, y: 136, w: 130, h: 160 }, // mushroom
  { x: 1582, y: 136, w: 110, h: 160 }, // broccoli
  { x: 1734, y: 136, w: 150, h: 160 }, // watermelon
  { x: 1906, y: 136, w: 150, h: 160 }, // pepper
  { x: 2068, y: 136, w: 170, h: 160 }, // kiwi
  { x: 2250, y: 136, w: 140, h: 160 }, // lemon
  { x: 2432, y: 136, w: 130, h: 160 }, // peach
  { x: 2604, y: 136, w: 130, h: 160 }, // peanut
  { x: 2786, y: 136, w: 110, h: 160 }, // apple
  { x: 2948, y: 136, w: 130, h: 160 }, // tomato
  { x: 3110, y: 136, w: 150, h: 160 }, // berries
  { x: 3302, y: 136, w: 110, h: 160 }, // grapes2
  { x: 3454, y: 136, w: 150, h: 160 }, // pineapple
  { x: 3637, y: 136, w: 130, h: 160 }, // melon
];

let fruitsImg: HTMLImageElement | null = null;
let fruitsLoaded = false;
const fruitsCallbacks: Array<() => void> = [];

function loadFruitsImage(cb: () => void) {
  if (fruitsLoaded) {
    cb();
    return;
  }
  fruitsCallbacks.push(cb);
  if (fruitsImg) return;

  const img = new Image();
  img.onload = () => {
    fruitsLoaded = true;
    fruitsCallbacks.forEach((f) => f());
    fruitsCallbacks.length = 0;
  };
  img.onerror = () => console.error('Failed to load fruits sprite');
  img.src = '/snake-assets/fruits.png';
  fruitsImg = img;
}

// ── Estado del juego ─────────────────────────────────────────────────────
type Cell = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';
type GameStatus = 'playing' | 'gameover';

type Game = {
  snake: Cell[];
  direction: Direction;
  pendingDirection: Direction;
  fruit: Cell & { sprite: number };
  score: number;
  level: number;
  tickInterval: number;
  tickAcc: number;
  fruitsEaten: number;
  gameState: GameStatus;
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

function randomFreeCell(snake: Cell[]): Cell {
  const occupied = new Set(snake.map((c) => `${c.x},${c.y}`));
  let x: number, y: number;
  do {
    x = Math.floor(Math.random() * COLS);
    y = Math.floor(Math.random() * ROWS);
  } while (occupied.has(`${x},${y}`));
  return { x, y };
}

function spawnFruit(snake: Cell[]): Cell & { sprite: number } {
  const cell = randomFreeCell(snake);
  const sprite = Math.floor(Math.random() * FRUIT_SPRITES.length);
  return { ...cell, sprite };
}

function createGame(): Game {
  const cy = Math.floor(ROWS / 2);
  const cx = Math.floor(COLS / 2);
  const snake: Cell[] = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  return {
    snake,
    direction: 'right',
    pendingDirection: 'right',
    fruit: spawnFruit(snake),
    score: 0,
    level: 1,
    tickInterval: BASE_TICK_MS,
    tickAcc: 0,
    fruitsEaten: 0,
    gameState: 'playing',
  };
}

function stepGame(g: Game) {
  if (g.gameState !== 'playing') return;

  g.direction = g.pendingDirection;

  const head = g.snake[0];
  let nx = head.x;
  let ny = head.y;
  if (g.direction === 'up') ny -= 1;
  if (g.direction === 'down') ny += 1;
  if (g.direction === 'left') nx -= 1;
  if (g.direction === 'right') nx += 1;

  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
    g.gameState = 'gameover';
    return;
  }

  const newHead: Cell = { x: nx, y: ny };
  const bitesSelf = g.snake.some((c) => c.x === nx && c.y === ny);
  if (bitesSelf) {
    g.gameState = 'gameover';
    return;
  }

  g.snake.unshift(newHead);

  if (nx === g.fruit.x && ny === g.fruit.y) {
    g.score += 10;
    g.fruitsEaten += 1;
    if (g.fruitsEaten % FRUITS_PER_LEVEL === 0) {
      g.level += 1;
      g.tickInterval = Math.max(
        MIN_TICK_MS,
        BASE_TICK_MS - (g.level - 1) * TICK_STEP_MS,
      );
    }
    g.fruit = spawnFruit(g.snake);
  } else {
    g.snake.pop();
  }
}

function drawGame(g: Game, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL, 0);
    ctx.lineTo(c * CELL, H);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(W, r * CELL);
    ctx.stroke();
  }

  if (fruitsLoaded && fruitsImg) {
    const sp = FRUIT_SPRITES[g.fruit.sprite];
    ctx.drawImage(
      fruitsImg,
      sp.x,
      sp.y,
      sp.w,
      sp.h,
      g.fruit.x * CELL,
      g.fruit.y * CELL,
      CELL,
      CELL,
    );
  }

  g.snake.forEach((c, i) => {
    ctx.fillStyle = i === 0 ? '#22c55e' : '#16a34a';
    ctx.fillRect(c.x * CELL + 1, c.y * CELL + 1, CELL - 2, CELL - 2);
  });

  if (g.gameState === 'gameover') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', W / 2, H / 2);
  }
}

// ── Componente React ─────────────────────────────────────────────────────
const Snake = forwardRef<SnakeHandle, SnakeProps>(function Snake(
  { paused, onStateChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game>(createGame());
  const pausedRef = useRef(paused);
  const onStateChangeRef = useRef(onStateChange);
  const lastEmittedRef = useRef<SnakeState | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  pausedRef.current = paused;
  onStateChangeRef.current = onStateChange;

  useImperativeHandle(
    ref,
    () => ({
      forceGameOver() {
        gameRef.current.gameState = 'gameover';
      },
      restart() {
        gameRef.current = createGame();
        lastEmittedRef.current = null;
      },
    }),
    [],
  );

  useEffect(() => {
    loadFruitsImage(() => {});

    const handleKeyDown = (e: KeyboardEvent) => {
      let dir: Direction | null = null;
      if (e.key === 'ArrowUp') dir = 'up';
      else if (e.key === 'ArrowDown') dir = 'down';
      else if (e.key === 'ArrowLeft') dir = 'left';
      else if (e.key === 'ArrowRight') dir = 'right';
      if (!dir) return;
      e.preventDefault();

      const g = gameRef.current;
      if (dir === OPPOSITE[g.direction]) return;
      g.pendingDirection = dir;
    };
    window.addEventListener('keydown', handleKeyDown);

    const loop = (ts: number) => {
      const g = gameRef.current;
      const dt = lastTimeRef.current === null ? 0 : ts - lastTimeRef.current;
      lastTimeRef.current = ts;

      if (!pausedRef.current && g.gameState === 'playing') {
        g.tickAcc += dt;
        while (g.tickAcc >= g.tickInterval) {
          g.tickAcc -= g.tickInterval;
          stepGame(g);
          if (g.gameState !== 'playing') {
            g.tickAcc = 0;
            break;
          }
        }
      }

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawGame(g, ctx);

      const next: SnakeState = {
        score: g.score,
        lives: g.gameState === 'gameover' ? 0 : 1,
        level: g.level,
        gameOver: g.gameState === 'gameover',
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
      width={800}
      height={600}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
});

Snake.displayName = 'Snake';

export default Snake;
