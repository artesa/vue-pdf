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
    scrollPositionX + Math.floor(containerViewportWidth / 2);
  const centerOfScrollBarY =
    scrollPositionY + Math.floor(containerViewportHeight / 2);

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

  const centerOfScrollBarX = prevScrollData.scrollPercentX * realContentWidth;
  const centerOfScrollBarY = prevScrollData.scrollPercentY * realContentHeight;

  const scrollPositionX = centerOfScrollBarX - containerViewportWidth / 2;
  const scrollPositionY = centerOfScrollBarY - containerViewportHeight / 2;

  container.scrollTo(scrollPositionX, scrollPositionY);
}
