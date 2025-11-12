// Detect Safari iOS for special handling
const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

/**
 * Round to avoid sub-pixel drift on Safari iOS
 */
function safariRound(value: number): number {
  return isSafariIOS ? Math.round(value * 100) / 100 : value;
}

/**
 * Get the current scroll position of a scroll container as percentages
 * @param container The scroll container
 * @returns Data about the current scroll position. Can be used to restore the scroll position later with `restoreScrollPosition()`
 */
export function getScrollPosition(container: HTMLElement) {
  // real content width/height without scrollbars
  const realContentWidth = container.scrollWidth;
  const realContentHeight = container.scrollHeight;

  // Round scroll positions to avoid Safari iOS sub-pixel issues
  const scrollPositionX = safariRound(container.scrollLeft);
  const scrollPositionY = safariRound(container.scrollTop);

  // viewport width/height without scrollbars
  const containerViewportWidth = container.clientWidth;
  const containerViewportHeight = container.clientHeight;

  // Calculate center of viewport relative to content
  const centerOfScrollBarX = scrollPositionX + containerViewportWidth / 2;
  const centerOfScrollBarY = scrollPositionY + containerViewportHeight / 2;

  // Calculate scroll percentages without unnecessary precision factors
  const scrollPercentX = centerOfScrollBarX / realContentWidth;
  const scrollPercentY = centerOfScrollBarY / realContentHeight;

  return {
    scrollPercentX,
    scrollPercentY,
    centerOfScrollBarX,
    centerOfScrollBarY,
    realContentWidth,
    realContentHeight,
    containerViewportWidth,
    containerViewportHeight,
    scrollPositionY,
    scrollPositionX,
  };
}

/**
 * Restore the scroll position of a scroll container from previously captured scroll data
 * @param container The scroll container
 * @param prevScrollData Previous captured scroll data with `getScrollPosition()`
 */
export function restoreScrollPosition(
  container: HTMLElement,
  prevScrollData: ReturnType<typeof getScrollPosition>
) {
  const {
    realContentWidth,
    realContentHeight,
    containerViewportHeight,
    containerViewportWidth,
  } = getScrollPosition(container);

  // Calculate new center positions based on the stored percentages
  const centerOfScrollBarX = prevScrollData.scrollPercentX * realContentWidth;
  const centerOfScrollBarY = prevScrollData.scrollPercentY * realContentHeight;

  // Calculate scroll positions by subtracting half the viewport size
  let scrollPositionX = centerOfScrollBarX - containerViewportWidth / 2;
  let scrollPositionY = centerOfScrollBarY - containerViewportHeight / 2;

  // Round scroll positions for Safari iOS to prevent sub-pixel drift
  scrollPositionX = safariRound(scrollPositionX);
  scrollPositionY = safariRound(scrollPositionY);

  // Use requestAnimationFrame on Safari iOS to ensure smooth scrolling and handle momentum scrolling
  if (isSafariIOS) {
    // Stop any ongoing momentum scrolling first
    (container.style as any).webkitOverflowScrolling = 'auto';

    requestAnimationFrame(() => {
      container.scrollTo(scrollPositionX, scrollPositionY);

      // Re-enable momentum scrolling after positioning
      requestAnimationFrame(() => {
        (container.style as any).webkitOverflowScrolling = 'touch';
      });
    });
  } else {
    container.scrollTo(scrollPositionX, scrollPositionY);
  }
}
