// Detect Safari iOS for special handling
const isSafariIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

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
  const scrollPositionX = container.scrollLeft;
  const scrollPositionY = container.scrollTop;

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

const animationFramePromise = () =>
  new Promise<Parameters<FrameRequestCallback>[0]>((resolve) =>
    requestAnimationFrame(resolve)
  );

/**
 * Restore the scroll position of a scroll container from previously captured scroll data
 * @param container The scroll container
 * @param prevScrollData Previous captured scroll data with `getScrollPosition()`
 */
export async function restoreScrollPosition(
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
  const scrollPositionX = centerOfScrollBarX - containerViewportWidth / 2;
  const scrollPositionY = centerOfScrollBarY - containerViewportHeight / 2;

  // Use requestAnimationFrame on Safari iOS to ensure smooth scrolling and handle momentum scrolling
  if (isSafariIOS) {
    // Stop any ongoing momentum scrolling first
    (container.style as any).webkitOverflowScrolling = "auto";

    await animationFramePromise();

    container.scrollTo({
      top: scrollPositionY,
      left: scrollPositionX,
      behavior: "instant",
    });

    await animationFramePromise();

    (container.style as any).webkitOverflowScrolling = "touch";
  } else {
    container.scrollTo({
      top: scrollPositionY,
      left: scrollPositionX,
      behavior: "instant",
    });
  }
}
