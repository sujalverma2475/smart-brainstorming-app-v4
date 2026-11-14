// djb2 string hash: position-dependent, so "ab" and "ba" get different hues
// (the old char-code sum gave them the same colour).
export const colorForUser = (name: string): string => {
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) + hash + name.charCodeAt(i)) | 0;
  }
  return `hsl(${Math.abs(hash) % 360}, 85%, 84%)`;
};

export const darkenColor = (color: string, percent: number): string => {
  const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return color;
  const [, h, s, l] = match.map(Number);
  return `hsl(${h}, ${s}%, ${Math.max(l - percent, 0)}%)`;
};
