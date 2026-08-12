import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QueryPreset } from '../../data/queryExamples';

interface Props {
  presets: QueryPreset[];
  onSelectPreset: (preset: QueryPreset) => void;
  disabled?: boolean;
}

export function PresetQueriesPanel({ presets, onSelectPreset, disabled }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const activePreset = presets.find(p => p.id === selectedId);

  return (
    <div style={{
      background: '#fff',
      border: 'var(--border)',
      boxShadow: 'var(--shadow-md)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 14px',
          borderBottom: isOpen ? 'var(--border)' : 'none',
          background: '#f9f5f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>💡</span>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#000',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            Example Queries ({presets.length})
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>
          {isOpen ? '▲ Hide' : '▼ Show'}
        </span>
      </div>

      {/* Preset List & Active Note */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#4b5563', fontWeight: 600, lineHeight: 1.4 }}>
                Click any preset query to load it directly into the editor:
              </p>

              {/* Scrollable / Grid of Presets */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 6,
                maxHeight: 180,
                overflowY: 'auto',
                paddingRight: 2,
              }}>
                {presets.map(preset => {
                  const isSelected = selectedId === preset.id;
                  return (
                    <motion.button
                      key={preset.id}
                      onClick={() => {
                        if (disabled) return;
                        setSelectedId(preset.id);
                        onSelectPreset(preset);
                      }}
                      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
                      whileTap={!disabled ? { scale: 0.98 } : {}}
                      style={{
                        padding: '6px 8px',
                        border: isSelected ? '2px solid #7c3aed' : '2px solid #000',
                        borderRadius: 8,
                        background: isSelected ? '#f5f3ff' : '#fff',
                        boxShadow: isSelected ? '2px 2px 0 #7c3aed' : '2px 2px 0 #000',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: disabled ? 0.6 : 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: 13, flexShrink: 0 }}>{preset.emoji}</span>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: isSelected ? '#6d28d9' : '#1f2937',
                        fontFamily: 'var(--font-sans)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {preset.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Note callout for selected preset */}
              {activePreset && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '8px 12px',
                    background: '#eff6ff',
                    border: '2px solid #3b82f6',
                    borderRadius: 8,
                    boxShadow: '2px 2px 0 #000',
                    fontSize: 11,
                    color: '#1e3a8a',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>📝 Note on "{activePreset.label}":</span>
                  </div>
                  {activePreset.note}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
