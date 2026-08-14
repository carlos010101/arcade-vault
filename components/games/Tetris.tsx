'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const NEXT_BLOCK = 30;

const COLORS = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#90caf9', // J - pale blue
  '#ffb74d', // L - orange
  '#9e9e9e', // N - tuerca (gris metálico)
];

const PIECES: (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const KEY_CODES = [
  'ArrowLeft',
  'ArrowRight',
  'ArrowDown',
  'ArrowUp',
  'KeyX',
  'Space',
];

export type TetrisState = {
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
};

export type TetrisProps = {
  paused: boolean;
  onStateChange: (state: TetrisState) => void;
};

export type TetrisHandle = {
  forceGameOver: () => void;
  restart: () => void;
};

type Piece = {
  type: number;
  shape: number[][];
  x: number;
  y: number;
};

type GameState = {
  board: number[][];
  current: Piece;
  next: Piece;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  dropAccum: number;
  dropInterval: number;
};

function createBoard(): number[][] {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece(): Piece {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = (PIECES[type] as number[][]).map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

function collide(board: number[][], shape: number[][], ox: number, oy: number) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape: number[][]) {
  const rows = shape.length;
  const cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate(g: GameState) {
  const rotated = rotateCW(g.current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(g.board, rotated, g.current.x + kick, g.current.y)) {
      g.current.shape = rotated;
      g.current.x += kick;
      return;
    }
  }
}

function merge(g: GameState) {
  for (let r = 0; r < g.current.shape.length; r++)
    for (let c = 0; c < g.current.shape[r].length; c++)
      if (g.current.shape[r][c])
        g.board[g.current.y + r][g.current.x + c] = g.current.shape[r][c];
}

function clearLines(g: GameState) {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (g.board[r].every((v) => v !== 0)) {
      g.board.splice(r, 1);
      g.board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    g.lines += cleared;
    g.score += (LINE_SCORES[cleared] || 0) * g.level;
    g.level = Math.floor(g.lines / 10) + 1;
    g.dropInterval = Math.max(100, 1000 - (g.level - 1) * 90);
  }
}

function ghostY(g: GameState) {
  let gy = g.current.y;
  while (!collide(g.board, g.current.shape, g.current.x, gy + 1)) gy++;
  return gy;
}

function spawn(g: GameState) {
  g.current = g.next;
  g.next = randomPiece();
  if (collide(g.board, g.current.shape, g.current.x, g.current.y)) {
    g.gameOver = true;
  }
}

function lockPiece(g: GameState) {
  merge(g);
  clearLines(g);
  spawn(g);
}

function hardDrop(g: GameState) {
  const gy = ghostY(g);
  g.score += (gy - g.current.y) * 2;
  g.current.y = gy;
  lockPiece(g);
}

function softDrop(g: GameState) {
  if (!collide(g.board, g.current.shape, g.current.x, g.current.y + 1)) {
    g.current.y++;
    g.score += 1;
  } else {
    lockPiece(g);
  }
}

function initGame(): GameState {
  const g: GameState = {
    board: createBoard(),
    current: randomPiece(),
    next: randomPiece(),
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    dropAccum: 0,
    dropInterval: 1000,
  };
  spawn(g);
  return g;
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colorIndex: number,
  size: number,
  alpha?: number,
) {
  if (!colorIndex) return;
  const color = COLORS[colorIndex] as string;
  ctx.globalAlpha = alpha ?? 1;
  ctx.fillStyle = color;
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  ctx.globalAlpha = 1;
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw(g: GameState, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);
  drawGrid(ctx);

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) drawBlock(ctx, c, r, g.board[r][c], BLOCK);

  const gy = ghostY(g);
  for (let r = 0; r < g.current.shape.length; r++)
    for (let c = 0; c < g.current.shape[r].length; c++)
      if (g.current.shape[r][c])
        drawBlock(
          ctx,
          g.current.x + c,
          gy + r,
          g.current.shape[r][c],
          BLOCK,
          0.2,
        );

  for (let r = 0; r < g.current.shape.length; r++)
    for (let c = 0; c < g.current.shape[r].length; c++)
      drawBlock(
        ctx,
        g.current.x + c,
        g.current.y + r,
        g.current.shape[r][c],
        BLOCK,
      );
}

function drawNext(g: GameState, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 120, 120);
  const shape = g.next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(ctx, offX + c, offY + r, shape[r][c], NEXT_BLOCK);
}

const Tetris = forwardRef<TetrisHandle, TetrisProps>(function Tetris(
  { paused, onStateChange },
  ref,
) {
  const boardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameState>(initGame());
  const pausedRef = useRef(paused);
  const onStateChangeRef = useRef(onStateChange);
  const lastEmittedRef = useRef<TetrisState | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  pausedRef.current = paused;
  onStateChangeRef.current = onStateChange;

  useImperativeHandle(
    ref,
    () => ({
      forceGameOver() {
        gameRef.current.gameOver = true;
      },
      restart() {
        gameRef.current = initGame();
        lastEmittedRef.current = null;
      },
    }),
    [],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!KEY_CODES.includes(e.code)) return;
      if (e.code === 'Space') e.preventDefault();
      const g = gameRef.current;
      if (pausedRef.current || g.gameOver) return;
      switch (e.code) {
        case 'ArrowLeft':
          if (!collide(g.board, g.current.shape, g.current.x - 1, g.current.y))
            g.current.x--;
          break;
        case 'ArrowRight':
          if (!collide(g.board, g.current.shape, g.current.x + 1, g.current.y))
            g.current.x++;
          break;
        case 'ArrowDown':
          softDrop(g);
          break;
        case 'ArrowUp':
        case 'KeyX':
          tryRotate(g);
          break;
        case 'Space':
          hardDrop(g);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const loop = (ts: number) => {
      const g = gameRef.current;
      const dt = lastTimeRef.current === null ? 0 : ts - lastTimeRef.current;
      lastTimeRef.current = ts;

      if (!pausedRef.current && !g.gameOver) {
        g.dropAccum += dt;
        if (g.dropAccum >= g.dropInterval) {
          g.dropAccum = 0;
          if (
            !collide(g.board, g.current.shape, g.current.x, g.current.y + 1)
          ) {
            g.current.y++;
          } else {
            lockPiece(g);
          }
        }
      }

      const boardCtx = boardCanvasRef.current?.getContext('2d');
      if (boardCtx) draw(g, boardCtx);
      const nextCtx = nextCanvasRef.current?.getContext('2d');
      if (nextCtx) drawNext(g, nextCtx);

      const next: TetrisState = {
        score: g.score,
        lines: g.lines,
        level: g.level,
        gameOver: g.gameOver,
      };
      const last = lastEmittedRef.current;
      if (
        !last ||
        last.score !== next.score ||
        last.lines !== next.lines ||
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
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#000',
      }}
    >
      <canvas
        ref={boardCanvasRef}
        width={COLS * BLOCK}
        height={ROWS * BLOCK}
        style={{ height: '100%', width: 'auto', display: 'block' }}
      />
      <canvas
        ref={nextCanvasRef}
        width={120}
        height={120}
        style={{
          width: 90,
          height: 90,
          display: 'block',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      />
    </div>
  );
});

Tetris.displayName = 'Tetris';

export default Tetris;
