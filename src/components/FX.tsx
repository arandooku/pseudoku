import { useEffect, useState } from 'react';
import { useGame } from '../store/game';
import type { FxEvent } from '../store/game';

export default function FX() {
  const fx = useGame((s) => s.fx);
  const consumeFx = useGame((s) => s.consumeFx);
  const [unitCells, setUnitCells] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!fx.length) return;
    const timers: number[] = [];
    for (const ev of fx) {
      const ttl = ev.kind === 'combo' ? 1200 : ev.kind === 'unit' ? 900 : ev.kind === 'flash' ? 450 : 800;
      if (ev.kind === 'unit' && ev.cells) {
        const cells = ev.cells;
        setUnitCells((prev) => {
          const next = new Set(prev);
          cells.forEach((c) => next.add(c));
          return next;
        });
        timers.push(window.setTimeout(() => {
          setUnitCells((prev) => {
            const next = new Set(prev);
            cells.forEach((c) => next.delete(c));
            return next;
          });
        }, ttl));
      }
      const id = ev.id;
      timers.push(window.setTimeout(() => consumeFx(id), ttl + 50));
    }
    return () => { timers.forEach((t) => window.clearTimeout(t)); };
  }, [fx, consumeFx]);

  return (
    <>
      <UnitSweepOverlay cells={unitCells} />
      {fx.map((ev) => <FxRender key={ev.id} ev={ev} />)}
    </>
  );
}

function FxRender({ ev }: { ev: FxEvent }) {
  if (ev.kind === 'combo' && ev.combo) {
    const size = Math.min(3 + ev.combo * 0.3, 6);
    const color = ev.combo >= 7 ? 'var(--danger-c)' : ev.combo >= 5 ? 'var(--accent-glow)' : 'var(--accent)';
    return (
      <div className="combo-pop" style={{ fontSize: `${size}rem`, color }}>
        {ev.combo}×
      </div>
    );
  }
  if (ev.kind === 'flash') {
    const bg = ev.tone === 'bad'
      ? 'radial-gradient(circle, rgba(239,68,68,0.55), transparent 70%)'
      : ev.tone === 'great'
        ? 'radial-gradient(circle, var(--accent-glow), transparent 70%)'
        : 'radial-gradient(circle, rgba(16,185,129,0.5), transparent 70%)';
    return <div className="screen-flash" style={{ background: bg }} />;
  }
  return null;
}

function UnitSweepOverlay({ cells }: { cells: Set<number> }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!cells.size) return;
    const el = document.querySelector('[data-board]') as HTMLElement | null;
    if (!el) return;
    setRect(el.getBoundingClientRect());
  }, [cells]);

  if (!cells.size || !rect) return null;
  const cellW = rect.width / 9;
  const cellH = rect.height / 9;
  return (
    <div
      className="pointer-events-none fixed z-30"
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
    >
      {Array.from(cells).map((i) => {
        const r = Math.floor(i / 9), c = i % 9;
        return (
          <div
            key={i}
            className="absolute unit-flash rounded-sm"
            style={{ left: c * cellW, top: r * cellH, width: cellW, height: cellH }}
          />
        );
      })}
    </div>
  );
}
