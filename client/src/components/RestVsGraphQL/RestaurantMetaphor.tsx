import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MENU_ITEMS = [
  { id: 'burger', label: '🍔 Burger', size: '120 KB' },
  { id: 'fries',  label: '🍟 Fries',  size: '45 KB' },
  { id: 'drink',  label: '🥤 Soda',   size: '30 KB' },
  { id: 'salad',  label: '🥗 Salad',  size: '60 KB' },
];

export function RestaurantMetaphorDemo() {
  const [selectedItems, setSelectedItems] = useState<string[]>(['burger', 'drink']);

  function toggleItem(id: string) {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  const restSize = 255;
  const gqlSize = selectedItems.reduce((acc, id) => {
    const item = MENU_ITEMS.find(m => m.id === id);
    return acc + parseInt(item?.size || '0');
  }, 0);

  return (
    <div style={{
      background: '#fff',
      border: 'var(--border)',
      boxShadow: 'var(--shadow-md)',
      borderRadius: 14,
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      {/* Teacher Explanation Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          background: '#ede9fe',
          border: '1.5px solid #7c3aed',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 800,
          color: '#6d28d9',
          marginBottom: 6,
        }}>
          <span>👨‍🏫 Interactive Concept</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#000', margin: '0 0 6px' }}>
          The Restaurant Metaphor: REST vs. GraphQL
        </h2>
        <p style={{ fontSize: 13, color: '#4b5563', maxWidth: 580, margin: '0 auto', lineHeight: 1.5, fontWeight: 500 }}>
          <strong>REST</strong> brings a fixed combo tray with items you didn't ask for. <strong>GraphQL</strong> lets you check off exact items on a menu card so you get only what you need.
        </p>
      </div>

      {/* Comparison Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
      }}>
        
        {/* ── REST SIDE ── */}
        <div style={{
          background: '#FFF5F5',
          border: '2px solid #000',
          boxShadow: '3px 3px 0 #000',
          borderRadius: 12,
          padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#b91c1c' }}>
              🔴 REST API (Fixed Endpoint)
            </span>
            <span style={{ fontSize: 10, fontWeight: 800, background: '#fee2e2', border: '1.5px solid #000', padding: '2px 8px', borderRadius: 20 }}>
              {restSize} KB (Over-fetching)
            </span>
          </div>

          <p style={{ fontSize: 11.5, color: '#4b5563', margin: '0 0 10px', lineHeight: 1.4 }}>
            You asked for a <strong>Burger</strong>, but <code>GET /api/meal</code> returns the fixed combo:
          </p>

          {/* Fixed Tray */}
          <div style={{
            background: '#fff',
            border: '2px solid #000',
            borderRadius: 8,
            padding: 10,
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
          }}>
            <div style={{ padding: '5px 10px', background: '#d1fae5', border: '1.5px solid #000', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
              🍔 Burger <span style={{ fontSize: 9.5, color: '#15803d' }}>(Wanted)</span>
            </div>
            <div style={{ padding: '5px 10px', background: '#fee2e2', border: '1.5px solid #000', borderRadius: 6, fontSize: 11, fontWeight: 700, opacity: 0.85 }}>
              🍟 Fries <span style={{ fontSize: 9.5, color: '#b91c1c' }}>(Wasted)</span>
            </div>
            <div style={{ padding: '5px 10px', background: '#fee2e2', border: '1.5px solid #000', borderRadius: 6, fontSize: 11, fontWeight: 700, opacity: 0.85 }}>
              🥤 Soda <span style={{ fontSize: 9.5, color: '#b91c1c' }}>(Wasted)</span>
            </div>
            <div style={{ padding: '5px 10px', background: '#fee2e2', border: '1.5px solid #000', borderRadius: 6, fontSize: 11, fontWeight: 700, opacity: 0.85 }}>
              🥗 Salad <span style={{ fontSize: 9.5, color: '#b91c1c' }}>(Wasted)</span>
            </div>
          </div>
        </div>

        {/* ── GRAPHQL SIDE ── */}
        <div style={{
          background: '#F0FDF4',
          border: '2px solid #000',
          boxShadow: '3px 3px 0 #000',
          borderRadius: 12,
          padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#15803d' }}>
              🟢 GraphQL (Declarative Query)
            </span>
            <span style={{ fontSize: 10, fontWeight: 800, background: '#d1fae5', border: '1.5px solid #000', padding: '2px 8px', borderRadius: 20 }}>
              {gqlSize} KB (Exact Payload)
            </span>
          </div>

          <p style={{ fontSize: 11.5, color: '#4b5563', margin: '0 0 8px', lineHeight: 1.4 }}>
            Check off what you want to build your custom query:
          </p>
          
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {MENU_ITEMS.map(item => {
              const active = selectedItems.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  style={{
                    padding: '3px 9px',
                    border: '1.5px solid #000',
                    borderRadius: 20,
                    background: active ? '#86efac' : '#fff',
                    boxShadow: active ? '1.5px 1.5px 0 #000' : 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {active ? '✓ ' : '+ '}{item.label}
                </button>
              );
            })}
          </div>

          {/* Custom Plate Animated Output */}
          <div style={{
            background: '#fff',
            border: '2px solid #000',
            borderRadius: 8,
            padding: 10,
            minHeight: 44,
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            {selectedItems.length === 0 ? (
              <span style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>
                Select items above to build your plate…
              </span>
            ) : (
              <AnimatePresence>
                {selectedItems.map(id => {
                  const item = MENU_ITEMS.find(m => m.id === id);
                  return (
                    <motion.div
                      key={id}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        padding: '4px 10px',
                        background: '#d1fae5',
                        border: '1.5px solid #000',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {item?.label}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
