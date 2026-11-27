export interface ScreenPoint { id: string; x: number; y: number }
export interface Cluster { ids: string[]; x: number; y: number }

/**
 * Greedy screen-space clustering: points closer than `radius` pixels to a cluster's first point join it.
 * Deterministic (input order) and O(n·k), plenty for a regional catalogue.
 */
export function clusterPoints(points: ScreenPoint[], radius = 44): Cluster[] {
  const clusters: (Cluster & { ax: number; ay: number })[] = [];
  const r2 = radius * radius;
  for (const p of points) {
    const c = clusters.find((k) => (k.ax - p.x) ** 2 + (k.ay - p.y) ** 2 <= r2);
    if (c) {
      c.ids.push(p.id);
      c.x += (p.x - c.x) / c.ids.length;
      c.y += (p.y - c.y) / c.ids.length;
    } else clusters.push({ ids: [p.id], x: p.x, y: p.y, ax: p.x, ay: p.y });
  }
  return clusters.map(({ ids, x, y }) => ({ ids, x, y }));
}

/** Spreads points that share exactly the same position on a small circle (pixels) so each stays clickable. */
export function spreadOffsets(count: number, radius = 22): [number, number][] {
  if (count <= 1) return [[0, 0]];
  return Array.from({ length: count }, (_, i) => {
    const a = (2 * Math.PI * i) / count - Math.PI / 2;
    return [Math.round(Math.cos(a) * radius), Math.round(Math.sin(a) * radius)];
  });
}
