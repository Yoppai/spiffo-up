export interface LayoutDimensions {
  width: number;
  height: number;
  leftWidth: number;
  rightWidth: number;
  isTooSmall: boolean;
}

export function calculateLayoutDimensions(width = 100, height = 30): LayoutDimensions {
  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);
  const leftWidth = Math.floor(safeWidth * 0.35);

  return {
    width: safeWidth,
    height: safeHeight,
    leftWidth,
    rightWidth: Math.max(0, safeWidth - leftWidth),
    isTooSmall: safeWidth < 60 || safeHeight < 18,
  };
}

export function truncateText(value: string, maxLength: number): string {
  if (maxLength <= 0) {
    return '';
  }

  if (value.length <= maxLength) {
    return value;
  }

  if (maxLength === 1) {
    return '…';
  }

  return `${value.slice(0, maxLength - 1)}…`;
}
