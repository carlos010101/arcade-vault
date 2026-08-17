'use client';

import { useEffect, useState } from 'react';

/** false en SSR y en el primer render cliente; true tras el efecto de montaje si el dispositivo soporta touch. */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync único al montar, no re-render en cascada.
    setIsTouch(navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
  }, []);

  return isTouch;
}
