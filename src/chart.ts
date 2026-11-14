/** Draw at CSS-pixel size so chart labels stay readable in a narrow rail. */
export function chartSurface(canvas: HTMLCanvasElement, preferredHeight = 184) {
  const width = Math.round(canvas.getBoundingClientRect().width);
  const context = canvas.getContext('2d');
  if (!context || !width) return null;
  const style = getComputedStyle(canvas);
  const fontSize = parseFloat(style.fontSize);
  const height = Math.round(preferredHeight * fontSize / 13);
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.height = height + 'px';
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.font = `500 ${fontSize}px ${style.getPropertyValue('--mono')}`;
  const color = (name: string) => style.getPropertyValue(name).trim();
  return { context, width, height, fontSize, color };
}
