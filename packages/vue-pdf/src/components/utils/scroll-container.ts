const PRECISION_FACTOR = 1000000;

/**
 * Get the current scroll position of a scroll container as percentages
 * @param container The scroll container
 * @returns Data about the current scroll position. Can be used to restore the scroll position later with `restoreScrollPosition()`
 */
export function getScrollPosition(container: HTMLElement) {
  // real content width/height without scrollbars
  const realContentWidth = container.scrollWidth;
  const realContentHeight = container.scrollHeight;

  const scrollPositionX = container.scrollLeft;
  const scrollPositionY = container.scrollTop;

  // viewport width/height without scrollbars
  const containerViewportWidth = container.clientWidth;
  const containerViewportHeight = container.clientHeight;

  const centerOfScrollBarX =
    scrollPositionX +
    Math.floor(
      (containerViewportWidth * PRECISION_FACTOR) / (2 * PRECISION_FACTOR)
    );
  const centerOfScrollBarY =
    scrollPositionY +
    Math.floor(
      (containerViewportHeight * PRECISION_FACTOR) / (2 * PRECISION_FACTOR)
    );

  const scrollPercentX =
    (centerOfScrollBarX * PRECISION_FACTOR) /
    (realContentWidth * PRECISION_FACTOR);
  const scrollPercentY =
    (centerOfScrollBarY * PRECISION_FACTOR) /
    (realContentHeight * PRECISION_FACTOR);

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

  const centerOfScrollBarX =
    (prevScrollData.scrollPercentX *
      PRECISION_FACTOR *
      (realContentWidth * PRECISION_FACTOR)) /
    (PRECISION_FACTOR * PRECISION_FACTOR);

  const centerOfScrollBarY =
    (prevScrollData.scrollPercentY *
      PRECISION_FACTOR *
      (realContentHeight * PRECISION_FACTOR)) /
    (PRECISION_FACTOR * PRECISION_FACTOR);

  const scrollPositionX =
    centerOfScrollBarX -
    (containerViewportWidth * PRECISION_FACTOR) / (2 * PRECISION_FACTOR);
  const scrollPositionY =
    centerOfScrollBarY -
    (containerViewportHeight * PRECISION_FACTOR) / (2 * PRECISION_FACTOR);

  container.scrollTo(scrollPositionX, scrollPositionY);
}
