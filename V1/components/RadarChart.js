"use client";

import React, { useMemo } from 'react';

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function polarToCartesian(value, angle, radius, center) {
  const r = (value / 100) * radius;
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  };
}

function buildPoints(axes, radius, center) {
  const step = (Math.PI * 2) / axes.length;
  return axes.map((axis, idx) => {
    const angle = -Math.PI / 2 + idx * step; // start at top, go clockwise
    return polarToCartesian(clamp(axis.value, 0, 100), angle, radius, center);
  });
}

export default function RadarChart({ scores = [], size = 360 }) {
  const center = size / 2;
  const radius = size / 2 - 24; // padding for labels
  const levels = 5;

  const axes = useMemo(() => {
    return scores.map((s) => ({
      key: s.skill_axes?.axis_key || s.axis_key || s.skill_axes?.display_name || 'axis',
      label: s.skill_axes?.display_name || s.skill_axes?.axis_key || s.axis_key || 'Axis',
      value: Number(s.score_0_100) || 0,
    }));
  }, [scores]);

  const polygons = useMemo(() => buildPoints(axes, radius, center), [axes, radius, center]);

  const gridRings = Array.from({ length: levels }, (_, i) => ((i + 1) / levels) * radius);

  if (!axes.length) return null;

  return (
    <div className="w-full flex justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.35)" />
              <stop offset="100%" stopColor="rgba(124,58,237,0.08)" />
            </radialGradient>
          </defs>

          {/* Grid rings */}
          {gridRings.map((r, idx) => (
            <circle
              key={r}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={idx === gridRings.length - 1 ? 1.2 : 0.8}
            />
          ))}

          {/* Spokes */}
          {axes.map((axis, idx) => {
            const angle = -Math.PI / 2 + (idx * (Math.PI * 2)) / axes.length;
            const end = polarToCartesian(100, angle, radius, center);
            return (
              <line
                key={axis.key}
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.8}
              />
            );
          })}

          {/* Radar shape */}
          <polygon
            points={polygons.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="url(#radarGlow)"
            stroke="rgba(14,165,233,0.8)"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Data points */}
          {polygons.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={4}
              fill="#0ea5e9"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={1.2}
            />
          ))}
        </svg>

        {/* Labels */}
        {axes.map((axis, idx) => {
          const angle = -Math.PI / 2 + (idx * (Math.PI * 2)) / axes.length;
          const labelPos = polarToCartesian(110, angle, radius, center); // slight outside
          return (
            <div
              key={`label-${axis.key}`}
              className="absolute text-base text-brand-light/90 text-center"
              style={{
                left: labelPos.x,
                top: labelPos.y,
                transform: 'translate(-50%, -50%)',
                width: 120,
                lineHeight: '1.4',
              }}
            >
              <div className="text-lg font-black text-brand-light">{axis.label}</div>
              <div className="text-sm font-semibold text-brand-light/80">{Math.round(axis.value)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
