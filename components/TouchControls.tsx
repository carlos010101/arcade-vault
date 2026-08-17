'use client';

export type TouchButton = {
  key: string; // KeyboardEvent.key, ej. 'ArrowLeft', ' ' (Espacio), 'ArrowUp'
  code: string; // KeyboardEvent.code, ej. 'ArrowLeft', 'Space'
  label: string; // texto del botón de acción, ej. 'DISPARAR' — solo aplica a botones de acción, no al D-pad
};

export type TouchControlsConfig = {
  dpad: {
    left?: TouchButton;
    right?: TouchButton;
    up?: TouchButton;
    down?: TouchButton;
  };
  actions: TouchButton[]; // 0 a 2 botones de acción, ej. DISPARAR, ROTAR, CAER
};

type TouchControlsProps = {
  config: TouchControlsConfig;
};

function dispatchKey(type: 'keydown' | 'keyup', btn: TouchButton) {
  window.dispatchEvent(
    new KeyboardEvent(type, { key: btn.key, code: btn.code, bubbles: true }),
  );
}

export default function TouchControls({ config }: TouchControlsProps) {
  const { dpad, actions } = config;

  return (
    <div className="touch-controls" aria-hidden="true">
      <div className="touch-dpad">
        <button
          type="button"
          className="touch-dpad-btn touch-dpad-up"
          disabled={!dpad.up}
          style={{ visibility: dpad.up ? 'visible' : 'hidden' }}
        >
          ▲
        </button>
        <button
          type="button"
          className="touch-dpad-btn touch-dpad-left"
          disabled={!dpad.left}
          style={{ visibility: dpad.left ? 'visible' : 'hidden' }}
        >
          ◀
        </button>
        <button
          type="button"
          className="touch-dpad-btn touch-dpad-right"
          disabled={!dpad.right}
          style={{ visibility: dpad.right ? 'visible' : 'hidden' }}
        >
          ▶
        </button>
        <button
          type="button"
          className="touch-dpad-btn touch-dpad-down"
          disabled={!dpad.down}
          style={{ visibility: dpad.down ? 'visible' : 'hidden' }}
        >
          ▼
        </button>
      </div>

      {actions.length > 0 && (
        <div className="touch-actions">
          {actions.map((btn) => (
            <button key={btn.code} type="button" className="touch-action-btn">
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
