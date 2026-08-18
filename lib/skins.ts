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

// ── Frogger ──────────────────────────────────────────────────────────────
export type FroggerSkin = GameSkin & {
  roadBg: string; // fondo de las filas de carretera
  riverBg: string; // fondo de las filas de río
  safeBg: string; // fondo de zonas seguras (mediana y salida)
  goalBg: string; // fondo de la fila de metas
  car: string; // relleno del auto
  carWheel: string; // ruedas del auto
  truck: string; // relleno del camión
  truckCab: string; // cabina del camión
  log: string; // relleno del tronco
  logVein: string; // vetas del tronco
  turtle: string; // relleno de la tortuga (alpha dinámico al sumergirse)
  goalBorder: string; // borde de la boca de meta
  goalFilled: string; // relleno de meta ya ocupada
  frogBody: string; // cuerpo de la rana
  frogEyeWhite: string; // esclerótica del ojo
  frogEyePupil: string; // pupila del ojo
  livesDot: string; // color de los indicadores de vida en el HUD
  timeGood: string; // barra de tiempo, tramo alto
  timeWarn: string; // barra de tiempo, tramo medio
  timeLow: string; // barra de tiempo, tramo bajo
  timeTrack: string; // fondo de la pista de la barra de tiempo
};

export type GameKey = 'asteroids' | 'snake' | 'arkanoid' | 'frogger';

export const GAME_SKINS: {
  asteroids: Record<SkinId, AsteroidsSkin>;
  snake: Record<SkinId, SnakeSkin>;
  arkanoid: Record<SkinId, ArkanoidSkin>;
  frogger: Record<SkinId, FroggerSkin>;
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
  frogger: {
    // Idéntico al aspecto actual del juego (previo a la introducción de skins).
    clasico: {
      bg: '#141414',
      grid: '#141414',
      fg: '#22c55e',
      accent: '#e5484d',
      hud: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.6)',
      glow: 0,
      roadBg: '#141414',
      riverBg: '#0a2e4a',
      safeBg: '#0f2a12',
      goalBg: '#123b1f',
      car: '#e5484d',
      carWheel: '#222222',
      truck: '#9ca3af',
      truckCab: '#4b5563',
      log: '#8a5a2b',
      logVein: '#5c3a1a',
      turtle: '#16a34a',
      goalBorder: '#d4af37',
      goalFilled: '#22c55e',
      frogBody: '#22c55e',
      frogEyeWhite: '#ffffff',
      frogEyePupil: '#000000',
      livesDot: '#22c55e',
      timeGood: '#22c55e',
      timeWarn: '#eab308',
      timeLow: '#ef4444',
      timeTrack: 'rgba(0, 0, 0, 0.5)',
    },
    // Fósforo ámbar monocromo: zonas se distinguen por sombras del mismo tono
    // sobre negro casi puro; elementos jugables en tonos de ámbar de brillo
    // creciente (auto > tortuga > camión/tronco), sin brillos.
    retro: {
      bg: '#0a0700',
      grid: '#0a0700',
      fg: '#ffcf66',
      accent: '#ffb000',
      hud: '#ffcf66',
      overlay: 'rgba(0, 0, 0, 0.65)',
      glow: 0,
      roadBg: '#0a0700',
      riverBg: '#050503',
      safeBg: '#0d0900',
      goalBg: '#120c00',
      car: '#ffb000',
      carWheel: '#4d3300',
      truck: '#cc8c00',
      truckCab: '#805800',
      log: '#996600',
      logVein: '#5c3d00',
      turtle: '#e6a300',
      goalBorder: '#ffb000',
      goalFilled: '#ffcf66',
      frogBody: '#ffcf66',
      frogEyeWhite: '#fff8e6',
      frogEyePupil: '#1a1200',
      livesDot: '#ffb000',
      timeGood: '#ffb000',
      timeWarn: '#cc8c00',
      timeLow: '#805800',
      timeTrack: 'rgba(255, 176, 0, 0.15)',
    },
    // Paleta cyan/magenta/amarillo de la app, con halo de shadowBlur.
    neon: {
      bg: '#0a0620',
      grid: '#0a0620',
      fg: '#00f5ff',
      accent: '#ff006e',
      hud: '#f5ff00',
      overlay: 'rgba(5, 3, 15, 0.7)',
      glow: 12,
      roadBg: '#0a0620',
      riverBg: '#05030f',
      safeBg: '#0c0620',
      goalBg: '#100826',
      car: '#ff006e',
      carWheel: '#3a0018',
      truck: '#f5ff00',
      truckCab: '#8a8b00',
      log: '#00f5ff',
      logVein: '#007a80',
      turtle: '#ff006e',
      goalBorder: '#f5ff00',
      goalFilled: '#00f5ff',
      frogBody: '#00f5ff',
      frogEyeWhite: '#ffffff',
      frogEyePupil: '#05030f',
      livesDot: '#ff006e',
      timeGood: '#00f5ff',
      timeWarn: '#f5ff00',
      timeLow: '#ff006e',
      timeTrack: 'rgba(0, 245, 255, 0.12)',
    },
  },
};

export function getSkin<K extends GameKey>(
  game: K,
  skin: SkinId,
): (typeof GAME_SKINS)[K][SkinId] {
  return GAME_SKINS[game][skin];
}
