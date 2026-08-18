'use client';

import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { getSkin, type ArkanoidSkin, type SkinId } from '@/lib/skins';

const W = 800;
const H = 600;

// Constante de módulo: si fuera un objeto inline en el JSX, se recrearía en
// cada render y el memo del componente perdería parte de su efecto.
const CANVAS_STYLE = {
  width: '100%',
  height: '100%',
  display: 'block',
} as const;

const PADDLE_SPEED = 400;
const BLOCK_COLS = 10;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- portado de game.js por fidelidad 1:1, sin uso ahí tampoco
const BLOCK_ROWS = 6;
const BLOCK_W = 64;
const BLOCK_H = 24;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- portado de game.js por fidelidad 1:1, solo usado como tipo aquí
const BLOCK_COLORS = [
  'red',
  'yellow',
  'cyan',
  'magenta',
  'hotpink',
  'green',
] as const;
const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
const BLOCKS_ORIGIN_Y = 80;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;

type BlockColor = (typeof BLOCK_COLORS)[number] | 'gray';

export type ArkanoidState = {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
};

export type ArkanoidProps = {
  paused: boolean;
  skin: SkinId;
  onStateChange: (state: ArkanoidState) => void;
};

export type ArkanoidHandle = {
  forceGameOver: () => void;
  restart: () => void;
};

// ── Spritesheet ──────────────────────────────────────────────────────────
type SpriteFrame = { sx: number; sy: number; sw: number; sh: number };

const EXPLOSION_FRAMES: Record<BlockColor, SpriteFrame[]> = {
  red: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
  cyan: [
    { sx: 256, sy: 192, sw: 32, sh: 16 },
    { sx: 288, sy: 192, sw: 32, sh: 16 },
    { sx: 320, sy: 192, sw: 32, sh: 16 },
    { sx: 352, sy: 192, sw: 32, sh: 16 },
  ],
  green: [
    { sx: 256, sy: 208, sw: 32, sh: 16 },
    { sx: 288, sy: 208, sw: 32, sh: 16 },
    { sx: 320, sy: 208, sw: 32, sh: 16 },
    { sx: 352, sy: 208, sw: 32, sh: 16 },
  ],
  magenta: [
    { sx: 256, sy: 224, sw: 32, sh: 16 },
    { sx: 288, sy: 224, sw: 32, sh: 16 },
    { sx: 320, sy: 224, sw: 32, sh: 16 },
    { sx: 352, sy: 224, sw: 32, sh: 16 },
  ],
  yellow: [
    { sx: 256, sy: 240, sw: 32, sh: 16 },
    { sx: 288, sy: 240, sw: 32, sh: 16 },
    { sx: 320, sy: 240, sw: 32, sh: 16 },
    { sx: 352, sy: 240, sw: 32, sh: 16 },
  ],
  hotpink: [
    { sx: 256, sy: 256, sw: 32, sh: 16 },
    { sx: 288, sy: 256, sw: 32, sh: 16 },
    { sx: 320, sy: 256, sw: 32, sh: 16 },
    { sx: 352, sy: 256, sw: 32, sh: 16 },
  ],
  gray: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
};

const EXPLOSION_DURATION = 150;

const SPRITES: {
  paddle: SpriteFrame;
  ball: SpriteFrame;
  blocks: Record<BlockColor, SpriteFrame>;
} = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  },
};

let ssImg: HTMLCanvasElement | null = null;
let ssLoaded = false;
const ssCallbacks: Array<() => void> = [];

function loadSpritesheet(cb: () => void) {
  if (ssLoaded) {
    cb();
    return;
  }
  ssCallbacks.push(cb);
  if (ssImg) return;

  const rawImg = new Image();
  rawImg.onload = () => {
    const oc = document.createElement('canvas');
    oc.width = rawImg.width;
    oc.height = rawImg.height;
    const octx = oc.getContext('2d');
    octx?.drawImage(rawImg, 0, 0);
    ssImg = oc;
    ssLoaded = true;
    ssCallbacks.forEach((f) => f());
    ssCallbacks.length = 0;
  };
  rawImg.onerror = () => console.error('Failed to load spritesheet');
  rawImg.src = '/games/arkanoid/spritesheet-breakout.png';
}

// Cache de spritesheet tintado por skin (el loader ssImg es un singleton a
// nivel de módulo: no se recarga el PNG, solo se tiñe una copia offscreen
// por skin y se reutiliza). `tint: null` (clasico y neon) sirve el original
// sin tocar — neon se distingue por bg/hud/halo, no por monocromatizar.
const ssTintCache = new Map<SkinId, HTMLCanvasElement>();

function getSheetSource(
  skinId: SkinId,
  palette: ArkanoidSkin,
): HTMLCanvasElement | null {
  if (!ssLoaded || !ssImg) return null;
  if (!palette.tint) return ssImg;

  const cached = ssTintCache.get(skinId);
  if (cached) return cached;

  const off = document.createElement('canvas');
  off.width = ssImg.width;
  off.height = ssImg.height;
  const octx = off.getContext('2d');
  if (!octx) return ssImg;
  octx.drawImage(ssImg, 0, 0);
  octx.globalCompositeOperation = 'source-atop';
  octx.fillStyle = palette.tint;
  octx.fillRect(0, 0, off.width, off.height);
  octx.globalCompositeOperation = 'source-over';

  ssTintCache.set(skinId, off);
  return off;
}

function applyGlow(
  ctx: CanvasRenderingContext2D,
  skin: ArkanoidSkin,
  color: string,
) {
  if (skin.glow > 0) {
    ctx.shadowBlur = skin.glow;
    ctx.shadowColor = color;
  } else {
    ctx.shadowBlur = 0;
  }
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLCanvasElement | null,
  frame: SpriteFrame,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (!sheet) return;
  ctx.drawImage(sheet, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLCanvasElement | null,
  name: 'paddle' | 'ball' | `block_${BlockColor}`,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (!sheet) return;
  let sp: SpriteFrame | undefined;
  if (name.startsWith('block_')) {
    sp = SPRITES.blocks[name.slice(6) as BlockColor];
  } else {
    sp = SPRITES[name as 'paddle' | 'ball'];
  }
  if (!sp) return;
  ctx.drawImage(sheet, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h);
}

// ── Niveles ──────────────────────────────────────────────────────────────
type BlockDef = { col: number; row: number; color: BlockColor };
type Level = { speed: number; blocks: BlockDef[] };

const LEVELS: Level[] = (() => {
  const rowColors1: BlockColor[] = [
    'red',
    'yellow',
    'cyan',
    'magenta',
    'hotpink',
    'green',
  ];
  const rowColors2: BlockColor[] = [
    'gray',
    'cyan',
    'hotpink',
    'yellow',
    'magenta',
    'green',
  ];
  const rowColors4: BlockColor[] = [
    'cyan',
    'magenta',
    'green',
    'yellow',
    'hotpink',
    'red',
  ];

  const l1: BlockDef[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      l1.push({ col, row, color: rowColors1[row] });

  const l2: BlockDef[] = [];
  const pyStart = [4, 3, 2, 1, 0, 0];
  const pyEnd = [5, 6, 7, 8, 9, 9];
  for (let row = 0; row < 6; row++)
    for (let col = pyStart[row]; col <= pyEnd[row]; col++)
      l2.push({ col, row, color: rowColors2[row] });

  const l3: BlockDef[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if ((col + row) % 2 === 0)
        l3.push({ col, row, color: row < 3 ? 'yellow' : 'magenta' });

  const gaps4 = [
    [2, 5, 8],
    [0, 4, 7, 9],
    [1, 3, 6],
    [2, 5, 8, 9],
    [0, 4, 7],
    [1, 3, 6, 9],
  ];
  const l4: BlockDef[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if (!gaps4[row].includes(col))
        l4.push({ col, row, color: rowColors4[row] });

  const l5: BlockDef[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++) {
      const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
      const isCross = col === 4 || row === 2;
      if (isFrame || isCross)
        l5.push({ col, row, color: isCross && !isFrame ? 'hotpink' : 'cyan' });
    }

  return [
    { speed: 1.0, blocks: l1 },
    { speed: 1.1, blocks: l2 },
    { speed: 1.21, blocks: l3 },
    { speed: 1.33, blocks: l4 },
    { speed: 1.46, blocks: l5 },
  ];
})();

// ── Estado del juego ─────────────────────────────────────────────────────
type Paddle = { x: number; y: number; w: number; h: number };
type Ball = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
};
type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  alive: boolean;
};
type Explosion = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  elapsed: number;
};
type GameStatus = 'playing' | 'gameover' | 'win';

type Game = {
  paddle: Paddle;
  ball: Ball;
  blocks: Block[];
  explosions: Explosion[];
  lives: number;
  score: number;
  gameState: GameStatus;
  currentLevel: number;
  keys: Record<string, boolean>;
};

function initPaddle(g: Game) {
  g.paddle.x = (W - g.paddle.w) / 2;
}

function initBall(g: Game) {
  const speed = LEVELS[g.currentLevel - 1].speed;
  g.ball.x = g.paddle.x + (g.paddle.w - g.ball.w) / 2;
  g.ball.y = g.paddle.y - g.ball.h;
  g.ball.vx = BASE_BALL_VX * speed;
  g.ball.vy = BASE_BALL_VY * speed;
}

function loadLevel(g: Game, n: number) {
  g.currentLevel = n;
  const level = LEVELS[n - 1];
  g.blocks = level.blocks.map((b) => ({
    x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
    y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
    w: BLOCK_W,
    h: BLOCK_H,
    color: b.color,
    alive: true,
  }));
  g.explosions = [];
  initBall(g);
}

function createGame(): Game {
  const g: Game = {
    paddle: { x: 0, y: 560, w: 81, h: 14 },
    ball: { x: 0, y: 0, w: 16, h: 16, vx: 200, vy: -300 },
    blocks: [],
    explosions: [],
    lives: 3,
    score: 0,
    gameState: 'playing',
    currentLevel: 1,
    keys: {},
  };
  initPaddle(g);
  loadLevel(g, 1);
  return g;
}

function collideAABB(ball: Ball, block: Block) {
  return (
    ball.x < block.x + block.w &&
    ball.x + ball.w > block.x &&
    ball.y < block.y + block.h &&
    ball.y + ball.h > block.y
  );
}

function updateGame(g: Game, dt: number) {
  if (g.gameState !== 'playing') return;

  if (g.keys['ArrowLeft'])
    g.paddle.x = Math.max(0, g.paddle.x - PADDLE_SPEED * dt);
  if (g.keys['ArrowRight'])
    g.paddle.x = Math.min(W - g.paddle.w, g.paddle.x + PADDLE_SPEED * dt);

  g.ball.x += g.ball.vx * dt;
  g.ball.y += g.ball.vy * dt;

  if (g.ball.x <= 0) {
    g.ball.x = 0;
    g.ball.vx = Math.abs(g.ball.vx);
  }
  if (g.ball.x + g.ball.w >= W) {
    g.ball.x = W - g.ball.w;
    g.ball.vx = -Math.abs(g.ball.vx);
  }
  if (g.ball.y <= 0) {
    g.ball.y = 0;
    g.ball.vy = Math.abs(g.ball.vy);
  }

  if (
    g.ball.vy > 0 &&
    g.ball.x + g.ball.w > g.paddle.x &&
    g.ball.x < g.paddle.x + g.paddle.w &&
    g.ball.y + g.ball.h >= g.paddle.y &&
    g.ball.y + g.ball.h <= g.paddle.y + g.paddle.h + 8
  ) {
    g.ball.y = g.paddle.y - g.ball.h;
    g.ball.vy = -Math.abs(g.ball.vy);
  }

  for (const block of g.blocks) {
    if (!block.alive) continue;
    if (collideAABB(g.ball, block)) {
      block.alive = false;
      g.explosions.push({
        x: block.x,
        y: block.y,
        w: block.w,
        h: block.h,
        color: block.color,
        elapsed: 0,
      });
      g.score += 10;
      g.ball.vy = -g.ball.vy;
      if (g.blocks.every((b) => !b.alive)) {
        if (g.currentLevel < 5) loadLevel(g, g.currentLevel + 1);
        else g.gameState = 'win';
      }
      break;
    }
  }

  if (g.explosions.length > 0) {
    for (const exp of g.explosions) exp.elapsed += dt * 1000;
    if (g.explosions.some((exp) => exp.elapsed >= EXPLOSION_DURATION)) {
      g.explosions = g.explosions.filter(
        (exp) => exp.elapsed < EXPLOSION_DURATION,
      );
    }
  }

  if (g.ball.y > H) {
    g.lives--;
    if (g.lives <= 0) {
      g.lives = 0;
      g.gameState = 'gameover';
    } else {
      initBall(g);
    }
  }
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  message: string,
  skin: ArkanoidSkin,
) {
  ctx.shadowBlur = 0;
  ctx.fillStyle = skin.overlay;
  ctx.fillRect(0, 0, W, H);
  applyGlow(ctx, skin, skin.hud);
  ctx.fillStyle = skin.hud;
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, W / 2, H / 2);
  ctx.shadowBlur = 0;
}

function drawGame(
  g: Game,
  ctx: CanvasRenderingContext2D,
  skin: ArkanoidSkin,
  sheet: HTMLCanvasElement | null,
) {
  ctx.fillStyle = skin.bg;
  ctx.fillRect(0, 0, W, H);

  for (const block of g.blocks) {
    if (block.alive)
      drawSprite(
        ctx,
        sheet,
        `block_${block.color}` as `block_${BlockColor}`,
        block.x,
        block.y,
        block.w,
        block.h,
      );
  }

  for (const exp of g.explosions) {
    const frameIndex = Math.min(
      Math.floor((exp.elapsed / EXPLOSION_DURATION) * 4),
      3,
    );
    drawFrame(
      ctx,
      sheet,
      EXPLOSION_FRAMES[exp.color][frameIndex],
      exp.x,
      exp.y,
      exp.w,
      exp.h,
    );
  }

  applyGlow(ctx, skin, skin.accent);
  drawSprite(
    ctx,
    sheet,
    'paddle',
    g.paddle.x,
    g.paddle.y,
    g.paddle.w,
    g.paddle.h,
  );
  drawSprite(ctx, sheet, 'ball', g.ball.x, g.ball.y, g.ball.w, g.ball.h);
  ctx.shadowBlur = 0;

  if (g.gameState === 'playing') {
    applyGlow(ctx, skin, skin.hud);
    ctx.fillStyle = skin.hud;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + g.score, 10, 10);
    ctx.textAlign = 'center';
    ctx.fillText('Nivel: ' + g.currentLevel, W / 2, 10);
    ctx.shadowBlur = 0;
    const ballSize = 16;
    const ballSpacing = 4;
    for (let i = 0; i < g.lives; i++) {
      const bx = W - 10 - (g.lives - i) * (ballSize + ballSpacing);
      drawSprite(ctx, sheet, 'ball', bx, 10, ballSize, ballSize);
    }
  }

  if (g.gameState === 'gameover') drawOverlay(ctx, 'GAME OVER', skin);
  if (g.gameState === 'win') drawOverlay(ctx, '¡Completaste el juego!', skin);
}

// ── Componente React ─────────────────────────────────────────────────────
const Arkanoid = forwardRef<ArkanoidHandle, ArkanoidProps>(function Arkanoid(
  { paused, skin, onStateChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game>(createGame());
  const pausedRef = useRef(paused);
  const onStateChangeRef = useRef(onStateChange);
  const skinIdRef = useRef<SkinId>(skin);
  const skinRef = useRef<ArkanoidSkin>(getSkin('arkanoid', skin));
  const lastEmittedRef = useRef<ArkanoidState | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const pauseDrawnRef = useRef(false);

  pausedRef.current = paused;
  onStateChangeRef.current = onStateChange;

  useEffect(() => {
    skinIdRef.current = skin;
    skinRef.current = getSkin('arkanoid', skin);
  }, [skin]);

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
    loadSpritesheet(() => {});

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      gameRef.current.keys[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      gameRef.current.keys[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const loop = (ts: number) => {
      const g = gameRef.current;
      const dt =
        lastTimeRef.current === null
          ? 0
          : Math.min((ts - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = ts;

      if (pausedRef.current) {
        // Congela el loop: solo se pinta un frame al entrar en pausa, no 60
        // veces por segundo bajo el overlay de "EN PAUSA".
        if (!pauseDrawnRef.current) {
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) {
            const sheet = getSheetSource(skinIdRef.current, skinRef.current);
            drawGame(g, ctx, skinRef.current, sheet);
          }
          pauseDrawnRef.current = true;
        }
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      pauseDrawnRef.current = false;

      updateGame(g, dt);

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        const sheet = getSheetSource(skinIdRef.current, skinRef.current);
        drawGame(g, ctx, skinRef.current, sheet);
      }

      const gameOver = g.gameState === 'gameover' || g.gameState === 'win';
      const last = lastEmittedRef.current;
      if (
        !last ||
        last.score !== g.score ||
        last.lives !== g.lives ||
        last.level !== g.currentLevel ||
        last.gameOver !== gameOver
      ) {
        const next: ArkanoidState = {
          score: g.score,
          lives: g.lives,
          level: g.currentLevel,
          gameOver,
        };
        lastEmittedRef.current = next;
        onStateChangeRef.current(next);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas ref={canvasRef} width={800} height={600} style={CANVAS_STYLE} />
  );
});

Arkanoid.displayName = 'Arkanoid';

export default memo(Arkanoid);
