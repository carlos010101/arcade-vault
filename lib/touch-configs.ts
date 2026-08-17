import type { TouchControlsConfig } from '@/components/TouchControls';

const ARROW_LEFT = { key: 'ArrowLeft', code: 'ArrowLeft', label: '' };
const ARROW_RIGHT = { key: 'ArrowRight', code: 'ArrowRight', label: '' };
const ARROW_UP = { key: 'ArrowUp', code: 'ArrowUp', label: '' };
const ARROW_DOWN = { key: 'ArrowDown', code: 'ArrowDown', label: '' };
const SPACE = { key: ' ', code: 'Space', label: '' };

export const ASTEROIDS_TOUCH_CONFIG: TouchControlsConfig = {
  dpad: { left: ARROW_LEFT, right: ARROW_RIGHT, up: ARROW_UP },
  actions: [{ ...SPACE, label: 'DISPARAR' }],
};

export const TETRIS_TOUCH_CONFIG: TouchControlsConfig = {
  dpad: { left: ARROW_LEFT, right: ARROW_RIGHT, down: ARROW_DOWN },
  actions: [
    { ...ARROW_UP, label: 'ROTAR' },
    { ...SPACE, label: 'CAER' },
  ],
};

export const ARKANOID_TOUCH_CONFIG: TouchControlsConfig = {
  dpad: { left: ARROW_LEFT, right: ARROW_RIGHT },
  actions: [],
};

export const SNAKE_TOUCH_CONFIG: TouchControlsConfig = {
  dpad: {
    left: ARROW_LEFT,
    right: ARROW_RIGHT,
    up: ARROW_UP,
    down: ARROW_DOWN,
  },
  actions: [],
};
