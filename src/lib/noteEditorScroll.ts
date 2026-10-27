type ScrollMetrics = {
  caretY: number;
  caretHeight: number;
  scrollY: number;
  viewportHeight: number;
  contentHeight: number;
};

export function getNoteEditorScrollY({
  caretY,
  caretHeight,
  scrollY,
  viewportHeight,
  contentHeight,
}: ScrollMetrics): number {
  if (viewportHeight <= 0 || contentHeight <= 0) return scrollY;

  const visibleTop = scrollY + 56;
  const visibleBottom = scrollY + Math.max(56, viewportHeight - 120);
  let nextY = scrollY;
  if (caretY < visibleTop) nextY = caretY - 56;
  else if (caretY + caretHeight > visibleBottom) {
    nextY = caretY + caretHeight - viewportHeight + 120;
  }
  return Math.max(0, Math.min(nextY, Math.max(0, contentHeight - viewportHeight)));
}
