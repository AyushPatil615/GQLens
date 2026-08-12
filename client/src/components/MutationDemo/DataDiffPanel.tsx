import { motion, AnimatePresence } from 'framer-motion';
import type { SnapshotRow } from '../../hooks/useMutationTrace';
import type { MutationOperationConfig } from '../../data/mutations';

interface Props {
  operation:   MutationOperationConfig;
  before:      SnapshotRow[];
  after:       SnapshotRow[];
  isComplete:  boolean;
  isError:     boolean;
  errorMsg:    string;
  success:     boolean;
  message:     string;
}

/** Returns the set of diffKey values that appear only in `after` (additions) */
function getAddedKeys(op: MutationOperationConfig, before: SnapshotRow[], after: SnapshotRow[]): Set<string> {
  const beforeKeys = new Set(before.map(r => r[op.diffKey]));
  const added = new Set<string>();
  after.forEach(r => { if (!beforeKeys.has(r[op.diffKey])) added.add(r[op.diffKey]); });
  return added;
}

/** Returns the set of diffKey values that appear only in `before` (removals) */
function getRemovedKeys(op: MutationOperationConfig, before: SnapshotRow[], after: SnapshotRow[]): Set<string> {
  const afterKeys = new Set(after.map(r => r[op.diffKey]));
  const removed = new Set<string>();
  before.forEach(r => { if (!afterKeys.has(r[op.diffKey])) removed.add(r[op.diffKey]); });
  return removed;
}

function RowCell({ value }: { value: string }) {
  return (
    <td style={{
      padding: '5px 10px',
      fontSize: 11.5,
      fontFamily: 'var(--font-mono)',
      color: '#000',
      borderRight: '1px solid #e5e7eb',
      whiteSpace: 'nowrap',
      maxWidth: 140,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      {value}
    </td>
  );
}

function SnapshotTable({
  rows,
  columns,
  highlightedKeys,
  highlightColor,
  prefix,
  diffKey,
  emptyLabel,
}: {
  rows: SnapshotRow[];
  columns: { key: string; label: string }[];
  highlightedKeys: Set<string>;
  highlightColor: string;
  prefix: '+' | '-' | ' ';
  diffKey: string;
  emptyLabel: string;
}) {
  return (
    <div style={{ overflowX: 'auto', flex: 1 }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 11,
      }}>
        <thead>
          <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #000' }}>
            <th style={{ width: 18, padding: '4px 6px', fontSize: 10, fontWeight: 800, textAlign: 'center' }}> </th>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: '5px 10px',
                textAlign: 'left',
                fontSize: 9.5,
                fontWeight: 800,
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderRight: '1px solid #e5e7eb',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                style={{ textAlign: 'center', padding: '14px', color: '#9ca3af', fontSize: 11, fontStyle: 'italic' }}
              >
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const isHighlighted = highlightedKeys.has(row[diffKey]);
              return (
                <motion.tr
                  key={i}
                  initial={isHighlighted ? { opacity: 0, x: prefix === '+' ? -12 : 12 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  style={{
                    background: isHighlighted ? highlightColor : (i % 2 === 0 ? '#fff' : '#f9fafb'),
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <td style={{
                    padding: '5px 6px',
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    color: prefix === '+' ? '#15803d' : prefix === '-' ? '#b91c1c' : '#9ca3af',
                    borderRight: '1px solid #e5e7eb',
                  }}>
                    {isHighlighted ? prefix : ' '}
                  </td>
                  {columns.map(col => (
                    <RowCell key={col.key} value={String(row[col.key] ?? '—')} />
                  ))}
                </motion.tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DataDiffPanel({ operation, before, after, isComplete, isError, errorMsg, success, message }: Props) {
  const addedKeys   = getAddedKeys(operation, before, after);
  const removedKeys = getRemovedKeys(operation, before, after);

  const beforeHighlight = removedKeys;
  const afterHighlight  = addedKeys;

  const diffCount = addedKeys.size + removedKeys.size;

  return (
    <div style={{
      background: '#fff',
      border: 'var(--border)',
      boxShadow: 'var(--shadow-md)',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: 'var(--border)',
        background: '#f9f5f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#000', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Data Diff — <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: '#ede9e0', padding: '1px 5px', borderRadius: 4 }}>{operation.diffTableLabel}</code>
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, fontWeight: 600 }}>
            What the database looked like before &amp; after
          </div>
        </div>

        {/* Status badge — complete OR error */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '4px 10px',
                background: success ? '#D1FAE5' : '#FEE2E2',
                border: `2px solid ${success ? '#000' : '#b91c1c'}`,
                boxShadow: '2px 2px 0 #000',
                borderRadius: 8,
                fontSize: 10, fontWeight: 800, color: '#000',
                whiteSpace: 'nowrap',
              }}
            >
              {success ? `✓ ${diffCount} row${diffCount !== 1 ? 's' : ''} changed` : '✗ failed'}
            </motion.div>
          )}
          {isError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '4px 10px',
                background: '#FEE2E2',
                border: '2px solid #b91c1c',
                boxShadow: '2px 2px 0 #000',
                borderRadius: 8,
                fontSize: 10, fontWeight: 800, color: '#b91c1c',
                whiteSpace: 'nowrap',
              }}
            >
              ✗ Error
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error state */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 24, textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#b91c1c', marginBottom: 10 }}>
            GraphQL Error
          </div>
          <div style={{
            padding: '10px 14px',
            background: '#FEF2F2',
            border: '2px solid #b91c1c',
            boxShadow: '2px 2px 0 #000',
            borderRadius: 8,
            fontSize: 11, fontWeight: 600,
            color: '#991b1b',
            fontFamily: 'var(--font-mono)',
            maxWidth: 280, lineHeight: 1.6,
            textAlign: 'left',
          }}>
            {errorMsg || 'The query failed validation.'}
          </div>
          <div style={{ marginTop: 12, fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>
            Fix the query above and try again.
          </div>
        </motion.div>
      )}

      {/* Idle state */}
      {!isComplete && !isError && before.length === 0 && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔄</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
            Diff Panel
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6 }}>
            Run the mutation to see<br />before &amp; after snapshots here.
          </div>
        </div>
      )}

      {/* Diff tables */}
      {(isComplete || before.length > 0) && (
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* BEFORE */}
          <div style={{ borderBottom: '2px solid #000' }}>
            <div style={{
              padding: '6px 12px',
              background: '#fef2f2',
              borderBottom: '1px solid #fca5a5',
              fontSize: 10, fontWeight: 800, color: '#b91c1c',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>—</span> BEFORE
              <span style={{ fontWeight: 500, color: '#6b7280', textTransform: 'none', letterSpacing: 0 }}>
                ({before.length} row{before.length !== 1 ? 's' : ''})
              </span>
            </div>
            <SnapshotTable
              rows={before}
              columns={operation.diffColumns}
              highlightedKeys={beforeHighlight}
              highlightColor='#FEE2E2'
              prefix='-'
              diffKey={operation.diffKey}
              emptyLabel='No rows yet'
            />
          </div>

          {/* AFTER */}
          <div>
            <div style={{
              padding: '6px 12px',
              background: '#f0fdf4',
              borderBottom: '1px solid #86efac',
              fontSize: 10, fontWeight: 800, color: '#15803d',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>+</span> AFTER
              <span style={{ fontWeight: 500, color: '#6b7280', textTransform: 'none', letterSpacing: 0 }}>
                ({after.length} row{after.length !== 1 ? 's' : ''})
              </span>
            </div>
            <SnapshotTable
              rows={after}
              columns={operation.diffColumns}
              highlightedKeys={afterHighlight}
              highlightColor='#D1FAE5'
              prefix='+'
              diffKey={operation.diffKey}
              emptyLabel='No rows after mutation'
            />
          </div>

          {/* Success / error message */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  margin: 10,
                  padding: '8px 12px',
                  background: success ? '#D1FAE5' : '#FEE2E2',
                  border: '2px solid #000',
                  boxShadow: '2px 2px 0 #000',
                  borderRadius: 8,
                  fontSize: 11, fontWeight: 700, color: '#000',
                }}>
                  {success ? '✓' : '✗'} {message}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
