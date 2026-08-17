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

type DpadButtonProps = {
  btn?: TouchButton;
  arrow: string;
  className: string;
};

function DpadButton({ btn, arrow, className }: DpadButtonProps) {
  return (
    <button
      type="button"
      className={`touch-dpad-btn ${className}`}
      disabled={!btn}
      style={{ visibility: btn ? 'visible' : 'hidden' }}
      onPointerDown={(e) => {
        e.preventDefault();
        if (btn) dispatchKey('keydown', btn);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        if (btn) dispatchKey('keyup', btn);
      }}
      onPointerLeave={(e) => {
        e.preventDefault();
        if (btn) dispatchKey('keyup', btn);
      }}
      onPointerCancel={(e) => {
        e.preventDefault();
        if (btn) dispatchKey('keyup', btn);
      }}
    >
      {arrow}
    </button>
  );
}

export default function TouchControls({ config }: TouchControlsProps) {
  const { dpad, actions } = config;

  return (
    <div className="touch-controls" aria-hidden="true">
      <div className="touch-dpad">
        <DpadButton btn={dpad.up} arrow="▲" className="touch-dpad-up" />
        <DpadButton btn={dpad.left} arrow="◀" className="touch-dpad-left" />
        <DpadButton btn={dpad.right} arrow="▶" className="touch-dpad-right" />
        <DpadButton btn={dpad.down} arrow="▼" className="touch-dpad-down" />
      </div>

      {actions.length > 0 && (
        <div className="touch-actions">
          {actions.map((btn) => (
            <button
              key={btn.code}
              type="button"
              className="touch-action-btn"
              onPointerDown={(e) => {
                e.preventDefault();
                dispatchKey('keydown', btn);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                dispatchKey('keyup', btn);
              }}
              onPointerLeave={(e) => {
                e.preventDefault();
                dispatchKey('keyup', btn);
              }}
              onPointerCancel={(e) => {
                e.preventDefault();
                dispatchKey('keyup', btn);
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
