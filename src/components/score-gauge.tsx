import { useEffect, useState } from "react";

interface Props {
  value: number;
  max?: number;
  label: string;
  tier: string;
}

export function ScoreGauge({ value, max = 1000, label, tier }: Props) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1400;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const pct = Math.min(1, animated / max);
  const radius = 110;
  const stroke = 14;
  const circ = 2 * Math.PI * radius;
  const dash = circ * pct;
  // semicircle: 270deg sweep
  const sweep = 0.75;
  const arcLen = circ * sweep;
  const arcDash = arcLen * pct;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[280px] w-[280px]">
        <svg
          viewBox="-130 -130 260 260"
          className="h-full w-full -rotate-[135deg]"
        >
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.72 0.20 260)" />
              <stop offset="100%" stopColor="oklch(0.72 0.22 295)" />
            </linearGradient>
          </defs>
          <circle
            r={radius}
            fill="none"
            stroke="oklch(1 0 0 / 8%)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLen} ${circ}`}
          />
          <circle
            r={radius}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcDash} ${circ}`}
            style={{ filter: "drop-shadow(0 0 12px oklch(0.7 0.2 280 / 60%))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </div>
          <div className="text-7xl font-bold text-gradient tabular-nums">
            {animated}
          </div>
          <div className="text-sm text-muted-foreground">of {max}</div>
          <div className="mt-3 rounded-full bg-white/10 px-4 py-1 text-sm font-medium">
            {tier}
          </div>
        </div>
      </div>
    </div>
  );
}
