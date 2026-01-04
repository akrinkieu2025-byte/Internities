"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';

const axisLabels = ['Execution', 'Leadership', 'Strategy', 'Communication', 'Creativity', 'Ownership'];

function seededRng(seed = 17) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function clamp01(num) {
  return Math.max(0, Math.min(1, num));
}

function polarPoint(value01, angle, r, c) {
  const rScaled = clamp01(value01) * r;
  return {
    x: c + rScaled * Math.cos(angle),
    y: c + rScaled * Math.sin(angle),
  };
}

function valuesToPoints(values, radius, center) {
  const step = (Math.PI * 2) / axisLabels.length;
  return values.map((value, idx) => {
    const angle = -Math.PI / 2 + idx * step;
    return polarPoint(value, angle, radius, center);
  });
}

function pointsToString(points) {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

function buildSamples(count = 100) {
  const rand = seededRng(42);
  return Array.from({ length: count }, (_, idx) => {
    const focus = 0.45 + (idx / count) * 0.35; // later samples trend higher
    return axisLabels.map(() => {
      const wobble = (rand() - 0.5) * 0.16;
      return clamp01(focus + wobble);
    });
  });
}

function buildDurations(count = 100, slow = false) {
  const durations = [];
  for (let i = 0; i < count; i += 1) {
    if (i < 10) durations.push(slow ? 260 : 220);
    else if (i < 40) durations.push(slow ? 150 : 120);
    else durations.push(slow ? 70 : 50);
  }
  return durations;
}

export default function MatchRadarAnimation() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef(null);
  const inView = useInView(containerRef, { amount: 0.35, margin: '-10% 0px' });
  const [stage, setStage] = useState('company');
  const [currentSample, setCurrentSample] = useState(0);
  const [runId, setRunId] = useState(0);
  const [isMobilePerf, setIsMobilePerf] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mqNarrow = window.matchMedia('(max-width: 767px)');
    const mqCoarse = window.matchMedia('(pointer: coarse)');
    const update = () => setIsMobilePerf(mqNarrow.matches || mqCoarse.matches);
    update();
    mqNarrow.addEventListener('change', update);
    mqCoarse.addEventListener('change', update);
    return () => {
      mqNarrow.removeEventListener('change', update);
      mqCoarse.removeEventListener('change', update);
    };
  }, []);

  const performanceMode = isMobilePerf || prefersReducedMotion;
  const animationEnabled = inView && !prefersReducedMotion;

  const size = performanceMode ? 160 : 400;
  const padding = performanceMode ? 50 : 64;
  const paddedSize = size + padding * 2;
  const center = paddedSize / 2;
  const radius = performanceMode ? 56 : 170;
  const gridLevels = performanceMode ? 3 : 5;

  const companyValues = useMemo(() => [0.9, 0.74, 0.86, 0.78, 0.82, 0.88], []);
  const studentValues = useMemo(() => [0.62, 0.58, 0.65, 0.63, 0.6, 0.68], []);
  const finalValues = useMemo(() => [0.95, 0.82, 0.9, 0.86, 0.88, 0.92], []);

  const sampleValues = useMemo(() => (prefersReducedMotion ? [] : buildSamples(performanceMode ? 36 : 100)), [prefersReducedMotion, performanceMode]);
  const sampleDurations = useMemo(
    () => (prefersReducedMotion ? [] : buildDurations(sampleValues.length, performanceMode)),
    [prefersReducedMotion, performanceMode, sampleValues.length]
  );
  const samplePercents = useMemo(() => {
    if (prefersReducedMotion) return [];
    const rand = seededRng(1337);
    return Array.from({ length: sampleValues.length }, () => Math.round(20 + rand() * 70));
  }, [prefersReducedMotion, sampleValues.length]);

  const companyPolygon = useMemo(() => pointsToString(valuesToPoints(companyValues, radius, center)), [companyValues, center, radius]);
  const studentPolygon = useMemo(() => pointsToString(valuesToPoints(studentValues, radius, center)), [studentValues, center, radius]);
  const finalPolygon = useMemo(() => pointsToString(valuesToPoints(finalValues, radius, center)), [finalValues, center, radius]);
  const samplePolygons = useMemo(
    () => sampleValues.map((vals) => pointsToString(valuesToPoints(vals, radius, center))),
    [sampleValues, center, radius]
  );

  useEffect(() => {
    if (!animationEnabled && !prefersReducedMotion) {
      setStage('company');
      setCurrentSample(0);
      return () => {};
    }

    const timers = [];
    setStage('company');
    setCurrentSample(0);

    const companyDuration = performanceMode ? 2600 : 3200;
    const studentDuration = performanceMode ? 1400 : 1600;

    if (prefersReducedMotion) {
      timers.push(setTimeout(() => setStage('final'), 1400));
    } else {
      timers.push(setTimeout(() => setStage('student'), companyDuration));
      timers.push(setTimeout(() => setStage('sampling'), companyDuration + studentDuration));
    }

    return () => timers.forEach(clearTimeout);
  }, [animationEnabled, prefersReducedMotion, runId, performanceMode]);

  useEffect(() => {
    if (prefersReducedMotion || stage !== 'sampling' || !animationEnabled) return () => {};

    let cancelled = false;
    let idx = 0;
    const timeouts = [];

    const play = () => {
      if (cancelled) return;
      setCurrentSample(idx);
      const delay = sampleDurations[idx] || 60;
      if (idx >= samplePolygons.length - 1) {
        const t = setTimeout(() => {
          if (!cancelled) setStage('final');
        }, delay + 200);
        timeouts.push(t);
        return;
      }
      const t = setTimeout(() => {
        idx += 1;
        play();
      }, delay);
      timeouts.push(t);
    };

    play();
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [prefersReducedMotion, sampleDurations, samplePolygons.length, stage, runId, animationEnabled]);

  useEffect(() => {
    if (stage !== 'final' || !animationEnabled) return () => {};
    const hold = prefersReducedMotion ? 1800 : 2200;
    const t = setTimeout(() => setRunId((id) => id + 1), hold);
    return () => clearTimeout(t);
  }, [prefersReducedMotion, stage, animationEnabled]);

  const gridRings = useMemo(() => Array.from({ length: gridLevels }, (_, i) => ((i + 1) / gridLevels) * radius), [gridLevels, radius]);

  const axisLabelPositions = useMemo(() => {
    const angleStep = (Math.PI * 2) / axisLabels.length;
    return axisLabels.map((label, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = radius + (performanceMode ? 12 : 24);
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      let textAnchor = 'middle';
      let dx = 0;
      let dy = 2;
      if (cos > 0.25) {
        textAnchor = 'start';
        dx = 4;
      } else if (cos < -0.25) {
        textAnchor = 'end';
        dx = -4;
      }
      if (sin > 0.25) dy = 7;
      if (sin < -0.25) dy = -4;
      return { label, x, y, textAnchor, dx, dy };
    });
  }, [radius, center, performanceMode]);

  const showStudent = stage === 'student' || stage === 'sampling' || stage === 'final';
  const showSampling = stage === 'sampling';
  const showFinal = stage === 'final';

  let statusText = '';
  let statusColor = 'text-slate-200';
  
  if (stage === 'student') {
      statusText = '60% match';
  } else if (showSampling) {
      statusText = `Matching ${samplePercents[currentSample] || 20}%`;
      statusColor = 'text-slate-300';
  } else if (showFinal) {
      statusText = "98% match • It's a match";
      statusColor = 'text-emerald-400';
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[360px] aspect-square overflow-visible mx-auto flex flex-col items-center justify-center">
      
      <div className="absolute top-4 left-0 right-0 text-center z-10 pointer-events-none">
         <AnimatePresence mode="wait">
            {statusText && (
                <motion.div
                    key={stage === 'sampling' ? 'sampling' : statusText}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`text-xs sm:text-sm font-bold ${statusColor} drop-shadow-md`}
                >
                    {statusText}
                </motion.div>
            )}
         </AnimatePresence>
      </div>

      <svg
        viewBox={`0 0 ${paddedSize} ${paddedSize}`}
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={performanceMode ? 'rgba(59,130,246,0.28)' : 'rgba(59,130,246,0.35)'} />
            <stop offset="100%" stopColor={performanceMode ? 'rgba(14,116,144,0.06)' : 'rgba(14,116,144,0.08)'} />
          </radialGradient>
          <radialGradient id="matchGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(74,222,128,0.55)" />
            <stop offset="100%" stopColor="rgba(34,197,94,0.05)" />
          </radialGradient>
          <filter
            id="softGlow"
            x={-padding * 3}
            y={-padding * 3}
            width={paddedSize + padding * 6}
            height={paddedSize + padding * 6}
            filterUnits="userSpaceOnUse"
          >
            <feGaussianBlur stdDeviation={performanceMode ? 6 : 12} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="url(#radarGlow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ duration: 1.2 }}
        />

        {gridRings.map((r, idx) => (
          <motion.circle
            key={`ring-${r}`}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={idx === gridRings.length - 1 ? (performanceMode ? 0.9 : 1.2) : performanceMode ? 0.6 : 0.9}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.1 + idx * 0.08, duration: 0.8 }}
          />
        ))}

        {axisLabels.map((axis, idx) => {
          const angle = -Math.PI / 2 + (idx * (Math.PI * 2)) / axisLabels.length;
          const end = polarPoint(1, angle, radius, center);
          return (
            <motion.line
              key={`axis-${axis}`}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.4 + idx * 0.05, duration: 0.9 }}
            />
          );
        })}

        {axisLabelPositions.map((pos) => (
          <motion.text
            key={pos.label}
            x={pos.x}
            y={pos.y}
            textAnchor={pos.textAnchor}
            dx={pos.dx}
            dy={pos.dy}
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.86)"
              className="font-semibold uppercase"
              style={{ fontSize: performanceMode ? '10px' : '12px', letterSpacing: performanceMode ? '0.08em' : '0.18em' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.68 + pos.dx * 0.02, duration: 0.6 }}
          >
            {pos.label}
          </motion.text>
        ))}

        <motion.polygon
          points={companyPolygon}
          stroke="rgba(59,130,246,0.9)"
          strokeWidth="2.2"
          fill="rgba(59,130,246,0.16)"
          filter={performanceMode ? undefined : 'url(#softGlow)'}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 1.4, ease: 'easeOut' }}
        />

        {showStudent && (
          <motion.polygon
            points={studentPolygon}
            stroke="rgba(148,163,184,0.9)"
            strokeWidth="1.6"
            fill="rgba(148,163,184,0.08)"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: stage === 'student' ? 1 : 0.6, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: stage === 'student' ? 0.2 : 0 }}
          />
        )}

        {showSampling && samplePolygons.length > 0 && (
          <motion.polygon
            key={`sample-${currentSample}`}
            points={samplePolygons[currentSample]}
            stroke="rgba(94,234,212,0.45)"
            strokeWidth="1.2"
            fill="rgba(94,234,212,0.08)"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.96, 1, 1.02] }}
            transition={{ duration: (sampleDurations[currentSample] || 80) / 1000 + 0.15, ease: 'easeOut' }}
          />
        )}

        {showFinal && (
          <motion.g
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <motion.polygon
              points={finalPolygon}
              stroke="rgba(74,222,128,0.95)"
              strokeWidth="2.6"
              fill="url(#matchGlow)"
              filter={performanceMode ? undefined : 'url(#softGlow)'}
            />
            <motion.circle
              cx={center}
              cy={center}
              r={98}
              stroke="rgba(74,222,128,0.35)"
              strokeWidth="1.6"
              fill="none"
              animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.8, 0.35] }}
              transition={{ duration: 1.8 }}
            />
          </motion.g>
        )}
      </svg>
    </div>
  );
}
