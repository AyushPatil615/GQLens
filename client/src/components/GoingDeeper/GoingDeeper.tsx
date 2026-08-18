import { motion } from 'framer-motion';
import { N1Visualizer } from '../N1Visualizer/N1Visualizer';
import { NullBubbleDemo } from '../NullBubble/NullBubbleDemo';
import { AuthFlowDemo } from '../AuthFlow/AuthFlowDemo';
import { AdvancedQueriesDemo } from '../AdvancedQueries/AdvancedQueriesDemo';

const FLOATERS = [
  { char: '⚡', color: '#C4B5FD', top: '10%',   left: '2%',   size: 26 },
  { char: '●',  color: '#86EFAC', top: '6%',    right: '3%',  size: 16 },
  { char: '✦',  color: '#FDB97D', top: '40%',   left: '1.5%', size: 20 },
  { char: '⬡',  color: '#87CEEF', bottom: '25%',left: '3%',   size: 18 },
  { char: '▲',  color: '#FDA4AF', bottom: '12%',right: '4%',  size: 14 },
];

export function GoingDeeper() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(circle, #d4c5b5 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflowX: 'hidden',
    }}>

      {/* Floating decorations */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {FLOATERS.map((f, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
            style={{
              position: 'absolute',
              color: f.color,
              fontSize: f.size,
              fontWeight: 900,
              top: (f as any).top,
              left: (f as any).left,
              right: (f as any).right,
              bottom: (f as any).bottom,
            }}
          >
            {f.char}
          </motion.span>
        ))}
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '44px 24px 32px', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            display: 'inline-block',
            fontSize: 48, marginBottom: 14,
          }}
        >
          ⚡
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          style={{
            fontSize: 'clamp(26px, 4.5vw, 46px)',
            fontWeight: 900, color: '#000',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '-1px', lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          Going Deeper
        </motion.h1>

        {/* Underline */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          style={{
            width: 220, height: 4, margin: '0 auto 18px',
            background: 'linear-gradient(to right, #C4B5FD, #87CEEF, #86EFAC, #FDB97D)',
            borderRadius: 99,
          }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: 15.5, color: 'var(--text-mid)',
            maxWidth: 520, margin: '0 auto',
            lineHeight: 1.65, fontWeight: 600,
          }}
        >
          You've seen what GraphQL can do. Now learn the <strong style={{ color: '#000' }}>hidden trap</strong> every
          real-world GraphQL developer must know — and the industry fix that solves it.
        </motion.p>

        {/* Step breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 20,
            padding: '8px 16px',
            background: '#fff',
            border: '2.5px solid #000',
            boxShadow: '3px 3px 0 #000',
            borderRadius: 999,
            fontSize: 12, fontWeight: 700, color: '#000',
          }}
        >
          <span style={{
            background: '#000', color: '#fff',
            borderRadius: '50%', width: 18, height: 18,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900,
          }}>1</span>
          <span style={{ background: '#000', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>1</span>
          N+1 Problem &amp; DataLoader
          <span style={{ margin: '0 4px', color: '#9CA3AF' }}>→</span>
          <span style={{ background: '#000', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>2</span>
          Null Bubbling &amp; completeValue()
        </motion.div>
      </div>

      {/* Main content */}
      <div style={{
        padding: '0 24px 52px',
        maxWidth: 1180, margin: '0 auto', width: '100%',
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', gap: 48,
      }}>
        {/* Section 1: N+1 & DataLoader */}
        <div>
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: '#000', color: '#fff', borderRadius: '50%',
              width: 26, height: 26, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900, flexShrink: 0,
            }}>1</span>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#000', margin: 0 }}>
              The N+1 Problem &amp; DataLoader
            </h2>
          </div>
          <N1Visualizer />
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 2, background: '#000', opacity: 0.1 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap' }}>⚡ Going Deeper</span>
          <div style={{ flex: 1, height: 2, background: '#000', opacity: 0.1 }} />
        </div>

        {/* Section 2: Null Bubbling */}
        <div>
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: '#000', color: '#fff', borderRadius: '50%',
              width: 26, height: 26, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900, flexShrink: 0,
            }}>2</span>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#000', margin: 0 }}>
              Null Bubbling &amp; Partial Failure
            </h2>
          </div>
          <NullBubbleDemo />
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 2, background: '#000', opacity: 0.1 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap' }}>⚡ Going Deeper</span>
          <div style={{ flex: 1, height: 2, background: '#000', opacity: 0.1 }} />
        </div>

        {/* Section 3: Auth & Context Flow */}
        <div>
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: '#000', color: '#fff', borderRadius: '50%',
              width: 26, height: 26, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900, flexShrink: 0,
            }}>3</span>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#000', margin: 0 }}>
              Auth &amp; Context Flow
            </h2>
          </div>
          <AuthFlowDemo />
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 2, background: '#000', opacity: 0.1 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap' }}>⚡ Going Deeper</span>
          <div style={{ flex: 1, height: 2, background: '#000', opacity: 0.1 }} />
        </div>

        {/* Section 4: Advanced Query Patterns */}
        <div>
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: '#000', color: '#fff', borderRadius: '50%',
              width: 26, height: 26, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900, flexShrink: 0,
            }}>4</span>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#000', margin: 0 }}>
              Advanced Query Patterns
            </h2>
          </div>
          <AdvancedQueriesDemo />
        </div>
      </div>
    </div>
  );
}
