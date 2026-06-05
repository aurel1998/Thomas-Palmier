const SWIPE_MIN_PX = 52;
const SWIPE_RATIO = 1.25;

type SwipeHandlers = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

/**
 * Navigation mois par swipe horizontal (passive, n’intercepte pas le scroll vertical).
 */
export function attachAgendaMonthSwipe(
  element: HTMLElement | null,
  handlers: SwipeHandlers
): () => void {
  if (!element) return () => {};

  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!tracking) return;
    tracking = false;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (Math.abs(dx) < SWIPE_MIN_PX) return;
    if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;

    if (dx > 0) handlers.onSwipeRight();
    else handlers.onSwipeLeft();
  };

  const onTouchCancel = () => {
    tracking = false;
  };

  element.addEventListener("touchstart", onTouchStart, { passive: true });
  element.addEventListener("touchend", onTouchEnd, { passive: true });
  element.addEventListener("touchcancel", onTouchCancel, { passive: true });

  return () => {
    element.removeEventListener("touchstart", onTouchStart);
    element.removeEventListener("touchend", onTouchEnd);
    element.removeEventListener("touchcancel", onTouchCancel);
  };
}
