// Paletas intercambiables por juego. Fuente única de color para el render en
// canvas: ningún componente de components/games/*.tsx debe tener literales
// hex/rgba en sus funciones de dibujo, todo sale de getSkin(...).
//
// Ver references/skins/README.md para la memoria de decisiones (paletas,
// ratios de contraste WCAG, notas de sprites tintados).

export type SkinId = 'clasico' | 'retro' | 'neon';

export const SKINS: { id: SkinId; label: string }[] = [
  { id: 'clasico', label: 'CLÁSICO' },
  { id: 'retro', label: 'RETRO' },
  { id: 'neon', label: 'NEÓN' },
];

export const DEFAULT_SKIN: SkinId = 'clasico';

/** Tokens comunes a todo juego; cada juego extiende con los suyos. */
export type GameSkin = {
  bg: string; // fondo del canvas
  grid: string; // grilla / guías (si el juego no tiene grilla, queda sin usar)
  fg: string; // trazo o pieza principal
  accent: string; // acento (enemigos, power-ups, fruta, ovni…)
  hud: string; // texto sobre el canvas (SCORE, NIVEL, GAME OVER…)
  overlay: string; // texto/velo secundario (subtítulos, veladuras)
  glow: number; // 0 = sin shadowBlur; >0 = shadowBlur en px
};

/** Convierte un hex '#rrggbb' a 'rgba(r,g,b,alpha)'. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Asteroids ────────────────────────────────────────────────────────────
export type AsteroidsSkin = GameSkin & {
  thrust: string; // llama del propulsor
  particle: string; // color base de las partículas de explosión (alpha dinámico)
};

// ── Snake ────────────────────────────────────────────────────────────────
export type SnakeSkin = GameSkin & {
  head: string; // color de la cabeza de la serpiente
  body: string; // color del resto del cuerpo
  fruitTint: string | null; // null = sprite original sin tintar (clasico)
};

// ── Arkanoid ─────────────────────────────────────────────────────────────
export type ArkanoidSkin = GameSkin & {
  // Color de tintado del spritesheet (bloques, paleta, núcleo) vía
  // globalCompositeOperation 'source-atop'. `null` = sprite original, sin
  // tocar (clasico y neon conservan la paleta multicolor del asset; neon se
  // distingue por bg/hud/halo, no por monocromatizar el sprite).
  tint: string | null;
};

export type GameKey = 'asteroids' | 'snake' | 'arkanoid';

export const GAME_SKINS: {
  asteroids: Record<SkinId, AsteroidsSkin>;
  snake: Record<SkinId, SnakeSkin>;
  arkanoid: Record<SkinId, ArkanoidSkin>;
} = {
  asteroids: {
    // Idéntico al aspecto actual del juego (previo a la introducción de skins).
    clasico: {
      bg: '#000000',
      grid: '#000000',
      fg: '#ffffff',
      accent: '#00ffff',
      hud: '#ffffff',
      overlay: 'rgba(255, 255, 255, 0.65)',
      glow: 0,
      thrust: 'rgba(255, 130, 0, 0.85)',
      particle: '#ffffff',
    },
    // Fósforo ámbar monocromo sobre negro casi puro, sin brillos.
    retro: {
      bg: '#060400',
      grid: '#060400',
      fg: '#ffb000',
      accent: '#ffcf66',
      hud: '#ffb000',
      overlay: 'rgba(255, 176, 0, 0.65)',
      glow: 0,
      thrust: 'rgba(255, 122, 0, 0.85)',
      particle: '#ffb000',
    },
    // Paleta cyan/magenta/amarillo de la app, con halo de shadowBlur.
    neon: {
      bg: '#05030f',
      grid: '#05030f',
      fg: '#00f5ff',
      accent: '#ff006e',
      hud: '#f5ff00',
      overlay: 'rgba(0, 245, 255, 0.65)',
      glow: 10,
      thrust: 'rgba(255, 207, 58, 0.9)',
      particle: '#00f5ff',
    },
  },
  snake: {
    // Idéntico al aspecto actual del juego (previo a la introducción de skins).
    clasico: {
      bg: '#000000',
      grid: 'rgba(255, 255, 255, 0.05)',
      fg: '#22c55e',
      accent: '#16a34a',
      hud: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.6)',
      glow: 0,
      head: '#22c55e',
      body: '#16a34a',
      fruitTint: null,
    },
    // Fósforo verde CRT monocromo sobre casi negro, sin brillos.
    retro: {
      bg: '#001a00',
      grid: 'rgba(57, 255, 20, 0.08)',
      fg: '#39ff14',
      accent: '#1fae1f',
      hud: '#39ff14',
      overlay: 'rgba(0, 0, 0, 0.6)',
      glow: 0,
      head: '#39ff14',
      body: '#1fae1f',
      fruitTint: '#39ff14',
    },
    // Paleta cyan/magenta/amarillo de la app, con halo de shadowBlur.
    neon: {
      bg: '#05030f',
      grid: 'rgba(0, 245, 255, 0.06)',
      fg: '#00f5ff',
      accent: '#ff006e',
      hud: '#f5ff00',
      overlay: 'rgba(0, 0, 0, 0.6)',
      glow: 12,
      head: '#00f5ff',
      body: '#ff006e',
      fruitTint: '#00f5ff',
    },
  },
  arkanoid: {
    // Idéntico al aspecto actual del juego (previo a la introducción de skins).
    clasico: {
      bg: '#000000',
      grid: '#000000',
      fg: '#ffffff',
      accent: '#00ffff',
      hud: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.6)',
      glow: 0,
      tint: null,
    },
    // Fósforo ámbar monocromo: todo el spritesheet (bloques, paleta, núcleo)
    // se tinta a un solo tono sobre negro casi puro, sin brillos.
    retro: {
      bg: '#060400',
      grid: '#060400',
      fg: '#ffb000',
      accent: '#ffb000',
      hud: '#ffb000',
      overlay: 'rgba(0, 0, 0, 0.72)',
      glow: 0,
      tint: '#ffb000',
    },
    // Paleta cyan/magenta/amarillo de la app, con halo de shadowBlur en
    // paleta/núcleo/HUD. El spritesheet conserva su color original (ya es
    // multicolor neón de por sí): lo que cambia es el fondo, el HUD y el halo.
    neon: {
      bg: '#05030f',
      grid: '#05030f',
      fg: '#00f5ff',
      accent: '#ff006e',
      hud: '#f5ff00',
      overlay: 'rgba(5, 3, 15, 0.7)',
      glow: 10,
      tint: null,
    },
  },
};

export function getSkin<K extends GameKey>(
  game: K,
  skin: SkinId,
): (typeof GAME_SKINS)[K][SkinId] {
  return GAME_SKINS[game][skin];
}
