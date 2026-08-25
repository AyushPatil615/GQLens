import React from 'react';
import { motion } from 'framer-motion';

export const FloatingRockets: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 5,
      }}
      aria-hidden="true"
    >
      {/* ── Rocket 1: Top-Right High Cruiser ────────────────────────────── */}
      <motion.div
        initial={{ x: '92vw', y: '12vh', rotate: -35 }}
        animate={{
          x: ['92vw', '86vw', '94vw', '92vw'],
          y: ['12vh', '16vh', '10vh', '12vh'],
          rotate: [-35, -42, -28, -35],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,0.15))',
          pointerEvents: 'auto',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        whileHover={{ scale: 1.25, rotate: 0 }}
        whileTap={{ scale: 0.9 }}
        title="GQLens Explorer 🚀"
      >
        <span style={{ fontSize: 22, display: 'inline-block' }}>🚀</span>
        {/* Minimalist dashed jet trail */}
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], width: [14, 22, 14] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            height: 2,
            background: 'repeating-linear-gradient(90deg, #F59E0B 0px, #F59E0B 4px, transparent 4px, transparent 8px)',
            borderRadius: 2,
            transform: 'rotate(145deg)',
            transformOrigin: 'left center',
          }}
        />
      </motion.div>

      {/* ── Rocket 2: Bottom-Left Slow Drifter ──────────────────────────── */}
      <motion.div
        initial={{ x: '5vw', y: '78vh', rotate: 45 }}
        animate={{
          x: ['5vw', '10vw', '4vw', '5vw'],
          y: ['78vh', '72vh', '82vh', '78vh'],
          rotate: [45, 52, 38, 45],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,0.15))',
          pointerEvents: 'auto',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        whileHover={{ scale: 1.25, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        title="GQLens Orbiter 🛰️"
      >
        <span style={{ fontSize: 20, display: 'inline-block' }}>🚀</span>
        {/* Minimalist exhaust glow */}
        <motion.span
          animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            fontSize: 10,
            display: 'inline-block',
            transform: 'translate(-12px, 8px)',
          }}
        >
          ✨
        </motion.span>
      </motion.div>

      {/* ── Rocket 3: Mid-Right Horizontal Glider ───────────────────────── */}
      <motion.div
        initial={{ x: '88vw', y: '52vh', rotate: -15 }}
        animate={{
          x: ['88vw', '82vw', '90vw', '88vw'],
          y: ['52vh', '48vh', '56vh', '52vh'],
          rotate: [-15, -8, -22, -15],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,0.12))',
          pointerEvents: 'auto',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        whileHover={{ scale: 1.3, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        title="GQLens Probe 🛸"
      >
        <span style={{ fontSize: 19, display: 'inline-block' }}>🚀</span>
        <motion.div
          animate={{ opacity: [0.2, 0.6, 0.2], width: [10, 18, 10] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            height: 2,
            background: 'linear-gradient(90deg, #6366F1, transparent)',
            borderRadius: 2,
            transform: 'rotate(165deg)',
            transformOrigin: 'left center',
          }}
        />
      </motion.div>
    </div>
  );
};
