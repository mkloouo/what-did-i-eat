import { useCallback, useRef } from "react";

// On Android, dragging past a list's scroll boundary can still hand the
// touch to a Pressable underneath as a tap once released, since the list
// has nothing left to scroll. Suppress presses that land right after a
// drag/overscroll gesture so an overshoot doesn't get read as a tap.
export function useScrollTapGuard(cooldownMs = 150) {
  const blockedUntil = useRef(0);

  const onScrollBeginDrag = useCallback(() => {
    blockedUntil.current = Infinity;
  }, []);

  const onScrollEndDrag = useCallback(() => {
    blockedUntil.current = Date.now() + cooldownMs;
  }, [cooldownMs]);

  const guardedPress = useCallback((handler: () => void) => {
    if (Date.now() < blockedUntil.current) return;
    handler();
  }, []);

  return { onScrollBeginDrag, onScrollEndDrag, guardedPress };
}
