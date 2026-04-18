import { useMemo } from 'react';

export default function TitleBg() {
  const digits = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        digit: ((i * 7) % 9) + 1,
        left: (i * 37) % 100,
        size: 20 + ((i * 13) % 50),
        delay: (i * 0.6) % 12,
        dur: 14 + ((i * 3) % 10),
      })),
    [],
  );
  const blobs = useMemo(
    () => [
      { size: 420, left: -120, top: -80, color: 'var(--accent)', delay: 0 },
      { size: 360, left: '55%', top: '30%', color: 'var(--accent-glow)', delay: 4 },
      { size: 300, left: '10%', top: '70%', color: 'var(--success-c)', delay: 8 },
    ],
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {blobs.map((b, i) => (
        <div
          key={i}
          className="aurora-blob"
          style={{
            width: b.size, height: b.size,
            left: b.left, top: b.top,
            background: b.color, animationDelay: `${b.delay}s`,
          }}
        />
      ))}
      {digits.map((d) => (
        <span
          key={d.id}
          className="floating-digit"
          style={{
            left: `${d.left}%`,
            bottom: '-10vh',
            fontSize: `${d.size}px`,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.dur}s`,
          }}
        >
          {d.digit}
        </span>
      ))}
    </div>
  );
}
