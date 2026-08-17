'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  getSkin,
  withAlpha,
  type AsteroidsSkin,
  type SkinId,
} from '@/lib/skins';

const W = 800;
const H = 600;

const KEY_CODES = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'];

const POWERUP_DROP_CHANCE = 0.15;
const POWERUP_DURATION = 5;
const POWERUP_TTL = 12;
const TRIPLE_SPREAD = 0.18;

const RADII = [0, 16, 30, 50]; // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32]; // velocidad base por tamaño
const POINTS = [0, 100, 50, 20]; // puntos por tamaño

const wrap = (v: number, max: number) => ((v % max) + max) % max;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

function applyGlow(
  ctx: CanvasRenderingContext2D,
  skin: AsteroidsSkin,
  color: string,
) {
  if (skin.glow > 0) {
    ctx.shadowBlur = skin.glow;
    ctx.shadowColor = color;
  } else {
    ctx.shadowBlur = 0;
  }
}

export type AsteroidsState = {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
};

export type AsteroidsProps = {
  paused: boolean;
  skin: SkinId;
  onStateChange: (state: AsteroidsState) => void;
};

export type AsteroidsHandle = {
  forceGameOver: () => void;
  restart: () => void;
};

// ── Bullet ────────────────────────────────────────────────────────────────
class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl = 1.1;
  radius = 2;
  dead = false;

  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, skin: AsteroidsSkin) {
    ctx.save();
    applyGlow(ctx, skin, skin.fg);
    ctx.fillStyle = skin.fg;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────
class Asteroid {
  x: number;
  y: number;
  size: number;
  radius: number;
  dead = false;
  vx: number;
  vy: number;
  rotSpeed: number;
  rot: number;
  verts: [number, number][] = [];

  constructor(x: number, y: number, size = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    const n = randInt(8, 13);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split(): Asteroid[] {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw(ctx: CanvasRenderingContext2D, skin: AsteroidsSkin) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    applyGlow(ctx, skin, skin.fg);
    ctx.strokeStyle = skin.fg;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── PowerUp ───────────────────────────────────────────────────────────────
class PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = 12;
  ttl = POWERUP_TTL;
  dead = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, skin: AsteroidsSkin) {
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    applyGlow(ctx, skin, skin.accent);
    ctx.strokeStyle = skin.accent;
    ctx.lineWidth = 2;
    const r = this.radius * pulse;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.save();
    applyGlow(ctx, skin, skin.accent);
    ctx.fillStyle = skin.accent;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('3x', this.x, this.y);
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────
class Ship {
  x = W / 2;
  y = H / 2;
  angle = -Math.PI / 2;
  vx = 0;
  vy = 0;
  radius = 12;
  thrusting = false;
  invincible = 3;
  shootCooldown = 0;
  dead = false;
  tripleShot = 0;

  reset() {
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.dead = false;
  }

  update(dt: number, keys: Record<string, boolean>) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot > 0) this.tripleShot -= dt;

    const ROT = 3.5; // rad/s
    const THRUST = 260; // px/s²
    const DRAG = 0.987;

    if (keys['ArrowLeft']) this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot(): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw(ctx: CanvasRenderingContext2D, skin: AsteroidsSkin) {
    if (this.dead) return;
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
      return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    applyGlow(ctx, skin, skin.fg);
    ctx.strokeStyle = skin.fg;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-12, -9);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 9);
    ctx.closePath();
    ctx.stroke();

    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      applyGlow(ctx, skin, skin.thrust);
      ctx.strokeStyle = skin.thrust;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ───────────────────────────────────────────────
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  dead = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
  }

  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, skin: AsteroidsSkin) {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = withAlpha(skin.particle, Number(alpha.toFixed(2)));
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ─────────────────────────────────────────────────────
type GameStatus = 'playing' | 'dead' | 'gameover';

type GameState = {
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  particles: Particle[];
  powerUps: PowerUp[];
  score: number;
  lives: number;
  level: number;
  status: GameStatus;
  deadTimer: number;
  powerUpSpawned: boolean;
  killsSinceSpawn: number;
  keys: Record<string, boolean>;
  justPressed: Record<string, boolean>;
};

function createEmptyState(): GameState {
  return {
    ship: new Ship(),
    bullets: [],
    asteroids: [],
    particles: [],
    powerUps: [],
    score: 0,
    lives: 3,
    level: 1,
    status: 'playing',
    deadTimer: 0,
    powerUpSpawned: false,
    killsSinceSpawn: 0,
    keys: {},
    justPressed: {},
  };
}

function spawnAsteroids(g: GameState, count: number) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    g.asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame(): GameState {
  const g = createEmptyState();
  spawnAsteroids(g, 4);
  return g;
}

function nextLevel(g: GameState) {
  g.level++;
  g.bullets = [];
  g.particles = [];
  g.powerUps = [];
  g.powerUpSpawned = false;
  g.killsSinceSpawn = 0;
  g.ship.reset();
  spawnAsteroids(g, 3 + g.level);
}

function explode(g: GameState, x: number, y: number, count = 8) {
  for (let i = 0; i < count; i++) g.particles.push(new Particle(x, y));
}

function killShip(g: GameState) {
  explode(g, g.ship.x, g.ship.y, 14);
  g.ship.dead = true;
  g.lives--;
  if (g.lives <= 0) {
    g.status = 'gameover';
  } else {
    g.status = 'dead';
    g.deadTimer = 2;
  }
}

function consumePressed(g: GameState, code: string) {
  const val = g.justPressed[code];
  g.justPressed[code] = false;
  return val;
}

function updateGame(g: GameState, dt: number) {
  if (g.status === 'gameover') {
    // El reinicio por Espacio del original queda deshabilitado: solo restart() lo controla.
    g.particles.forEach((p) => p.update(dt));
    g.particles = g.particles.filter((p) => !p.dead);
    return;
  }

  if (g.status === 'dead') {
    g.deadTimer -= dt;
    g.particles.forEach((p) => p.update(dt));
    g.particles = g.particles.filter((p) => !p.dead);
    g.asteroids.forEach((a) => a.update(dt));
    if (g.deadTimer <= 0) {
      g.status = 'playing';
      g.ship.reset();
    }
    return;
  }

  if (consumePressed(g, 'Space')) {
    g.bullets.push(...g.ship.tryShoot());
  }

  g.ship.update(dt, g.keys);
  g.bullets.forEach((b) => b.update(dt));
  g.asteroids.forEach((a) => a.update(dt));
  g.particles.forEach((p) => p.update(dt));
  g.powerUps.forEach((p) => p.update(dt));

  g.bullets = g.bullets.filter((b) => !b.dead);
  g.particles = g.particles.filter((p) => !p.dead);
  g.powerUps = g.powerUps.filter((p) => !p.dead);

  for (const p of g.powerUps) {
    if (!p.dead && dist(g.ship, p) < g.ship.radius + p.radius) {
      p.dead = true;
      g.ship.tripleShot = POWERUP_DURATION;
    }
  }

  const newAsteroids: Asteroid[] = [];
  for (const b of g.bullets) {
    for (const a of g.asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        g.score += POINTS[a.size];
        explode(g, a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (!g.powerUpSpawned) {
          g.killsSinceSpawn++;
          const guaranteed = g.killsSinceSpawn >= 5;
          if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
            g.powerUps.push(new PowerUp(a.x, a.y));
            g.powerUpSpawned = true;
          }
        }
      }
    }
  }
  g.asteroids = g.asteroids.filter((a) => !a.dead).concat(newAsteroids);
  g.bullets = g.bullets.filter((b) => !b.dead);

  if (g.ship.invincible <= 0) {
    for (const a of g.asteroids) {
      if (dist(g.ship, a) < g.ship.radius + a.radius * 0.82) {
        killShip(g);
        break;
      }
    }
  }

  if (g.asteroids.length === 0) nextLevel(g);
}

// ── Draw ──────────────────────────────────────────────────────────────────
function drawLifeIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  skin: AsteroidsSkin,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  applyGlow(ctx, skin, skin.fg);
  ctx.strokeStyle = skin.fg;
  ctx.lineWidth = 1.2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD(
  g: GameState,
  ctx: CanvasRenderingContext2D,
  skin: AsteroidsSkin,
) {
  ctx.save();
  applyGlow(ctx, skin, skin.hud);
  ctx.fillStyle = skin.hud;
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${g.score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${g.level}`, W / 2, 26);
  ctx.restore();

  for (let i = 0; i < g.lives; i++)
    drawLifeIcon(ctx, W - 16 - i * 22, 18, skin);

  if (g.ship.tripleShot > 0) {
    ctx.save();
    applyGlow(ctx, skin, skin.accent);
    ctx.textAlign = 'left';
    ctx.fillStyle = skin.accent;
    ctx.fillText(`3x  ${g.ship.tripleShot.toFixed(1)}s`, 14, 46);
    ctx.restore();
  }
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  title: string,
  sub: string,
  skin: AsteroidsSkin,
) {
  ctx.save();
  ctx.textAlign = 'center';
  applyGlow(ctx, skin, skin.hud);
  ctx.fillStyle = skin.hud;
  ctx.font = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font = '18px monospace';
  ctx.fillStyle = skin.overlay;
  ctx.fillText(sub, W / 2, H / 2 + 22);
  ctx.restore();
}

function drawGame(
  g: GameState,
  ctx: CanvasRenderingContext2D,
  skin: AsteroidsSkin,
) {
  ctx.fillStyle = skin.bg;
  ctx.fillRect(0, 0, W, H);

  g.particles.forEach((p) => p.draw(ctx, skin));
  g.asteroids.forEach((a) => a.draw(ctx, skin));
  g.powerUps.forEach((p) => p.draw(ctx, skin));
  g.bullets.forEach((b) => b.draw(ctx, skin));
  g.ship.draw(ctx, skin);

  drawHUD(g, ctx, skin);

  if (g.status === 'gameover')
    drawOverlay(ctx, 'GAME OVER', `PUNTAJE: ${g.score}`, skin);
}

// ── Componente React ─────────────────────────────────────────────────────
const Asteroids = forwardRef<AsteroidsHandle, AsteroidsProps>(
  function Asteroids({ paused, skin, onStateChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const gameRef = useRef<GameState>(initGame());
    const pausedRef = useRef(paused);
    const onStateChangeRef = useRef(onStateChange);
    const skinRef = useRef<AsteroidsSkin>(getSkin('asteroids', skin));
    const lastEmittedRef = useRef<AsteroidsState | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);

    pausedRef.current = paused;
    onStateChangeRef.current = onStateChange;

    useEffect(() => {
      skinRef.current = getSkin('asteroids', skin);
    }, [skin]);

    useImperativeHandle(
      ref,
      () => ({
        forceGameOver() {
          const g = gameRef.current;
          if (g.status === 'gameover') return;
          explode(g, g.ship.x, g.ship.y, 14);
          g.ship.dead = true;
          g.lives = 0;
          g.status = 'gameover';
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
        e.preventDefault();
        const g = gameRef.current;
        if (!g.keys[e.code]) g.justPressed[e.code] = true;
        g.keys[e.code] = true;
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        if (!KEY_CODES.includes(e.code)) return;
        e.preventDefault();
        gameRef.current.keys[e.code] = false;
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

        if (!pausedRef.current) updateGame(g, dt);

        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) drawGame(g, ctx, skinRef.current);

        const next: AsteroidsState = {
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
        window.removeEventListener('keyup', handleKeyUp);
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
  },
);

Asteroids.displayName = 'Asteroids';

export default Asteroids;
