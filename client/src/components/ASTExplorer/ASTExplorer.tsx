import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parse, type DocumentNode, type ASTNode } from 'graphql';

// ─── Types ─────────────────────────────────────────────────────────────
interface TreeNode {
  id: string;
  kind: string;
  label: string;
  sublabel?: string;
  color: string;
  children: TreeNode[];
  depth: number;
}

// ─── Color map per AST kind ─────────────────────────────────────────────
const KIND_COLOR: Record<string, string> = {
  Document:            '#87CEEF',
  OperationDefinition: '#C4B5FD',
  SelectionSet:        '#FDB97D',
  Field:               '#86EFAC',
  Argument:            '#FDA4AF',
  Variable:            '#FCA5A5',
  IntValue:            '#d9f99d',
  StringValue:         '#d9f99d',
  BooleanValue:        '#d9f99d',
  FloatValue:          '#d9f99d',
  VariableDefinition:  '#fde68a',
  NamedType:           '#e0e7ff',
  ListType:            '#e0e7ff',
  NonNullType:         '#fecaca',
  InlineFragment:      '#fde68a',
  FragmentSpread:      '#fbcfe8',
  Directive:           '#bfdbfe',
};

function getColor(kind: string): string {
  return KIND_COLOR[kind] || '#e5e7eb';
}

// ─── Convert AST to a flat tree structure ──────────────────────────────
let _nodeCounter = 0;
function toTreeNode(node: ASTNode, depth: number): TreeNode | null {
  const id = `n-${++_nodeCounter}`;
  const kind = node.kind;
  const color = getColor(kind);

  // Determine a human label based on node type
  let label = kind;
  let sublabel: string | undefined;

  if ('name' in node && node.name) {
    label = (node.name as { value: string }).value;
    sublabel = kind;
  }
  if (kind === 'Document') { label = 'Document'; sublabel = 'Root'; }
  if (kind === 'OperationDefinition') {
    const op = node as { operation: string; name?: { value: string } };
    label = op.name ? op.name.value : `(anonymous ${op.operation})`;
    sublabel = op.operation.toUpperCase();
  }
  if (kind === 'SelectionSet') { label = '{ … }'; sublabel = 'SelectionSet'; }
  if (kind === 'Argument') {
    const a = node as { name: { value: string } };
    label = a.name.value;
    sublabel = 'Argument';
  }
  if (kind === 'Variable') {
    const v = node as { name: { value: string } };
    label = `$${v.name.value}`;
    sublabel = 'Variable';
  }
  if (kind === 'IntValue' || kind === 'StringValue' || kind === 'FloatValue' || kind === 'BooleanValue') {
    const v = node as { value: string };
    label = `${v.value}`;
    sublabel = kind.replace('Value', '') + ' literal';
  }

  // Recurse over child fields
  const children: TreeNode[] = [];
  const n = node as Record<string, unknown>;

  const childOrder = ['selectionSet', 'selections', 'arguments', 'variableDefinitions',
                      'directives', 'type', 'defaultValue', 'value'];

  for (const key of childOrder) {
    const val = n[key];
    if (!val) continue;
    if (Array.isArray(val)) {
      for (const child of val) {
        if (child && typeof child === 'object' && 'kind' in child) {
          const c = toTreeNode(child as ASTNode, depth + 1);
          if (c) children.push(c);
        }
      }
    } else if (typeof val === 'object' && val !== null && 'kind' in (val as object)) {
      const c = toTreeNode(val as ASTNode, depth + 1);
      if (c) children.push(c);
    }
  }

  return { id, kind, label, sublabel, color, children, depth };
}

function buildTree(doc: DocumentNode): TreeNode | null {
  _nodeCounter = 0;
  return toTreeNode(doc as ASTNode, 0);
}

// ─── Recursive tree renderer ────────────────────────────────────────────
function ASTNodeCard({ node, defaultOpen = true }: { node: TreeNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = node.children.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: node.depth * 0.03 }}
      style={{ marginLeft: node.depth === 0 ? 0 : 16 }}
    >
      {/* Node pill */}
      <div
        onClick={hasChildren ? () => setOpen(o => !o) : undefined}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px',
          borderRadius: 999,
          border: '2px solid #000',
          background: node.color,
          boxShadow: '2px 2px 0 #000',
          cursor: hasChildren ? 'pointer' : 'default',
          marginBottom: 6,
          userSelect: 'none',
        }}
      >
        {/* Expand toggle */}
        {hasChildren && (
          <span style={{ fontSize: 9, fontWeight: 900, color: '#000', lineHeight: 1 }}>
            {open ? '▼' : '▶'}
          </span>
        )}

        {/* Label */}
        <span style={{ fontSize: 11.5, fontWeight: 800, color: '#000', fontFamily: 'var(--font-mono)' }}>
          {node.label}
        </span>

        {/* Sublabel */}
        {node.sublabel && (
          <span style={{
            fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.5)',
            background: 'rgba(0,0,0,0.08)',
            padding: '1px 6px', borderRadius: 999,
          }}>
            {node.sublabel}
          </span>
        )}

        {/* Child count badge */}
        {hasChildren && (
          <span style={{
            fontSize: 9, fontWeight: 900, color: '#000',
            background: 'rgba(0,0,0,0.12)', borderRadius: 999,
            padding: '0px 5px',
          }}>
            {node.children.length}
          </span>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {open && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              paddingLeft: 8,
              borderLeft: '2.5px solid rgba(0,0,0,0.15)',
              marginLeft: 8,
              marginBottom: 6,
              display: 'flex', flexDirection: 'column', gap: 0,
            }}>
              {node.children.map(child => (
                <ASTNodeCard key={child.id} node={child} defaultOpen={child.depth < 3} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Legend ─────────────────────────────────────────────────────────────
const LEGEND = [
  { kind: 'Document',            label: 'Document'    },
  { kind: 'OperationDefinition', label: 'Operation'   },
  { kind: 'Field',               label: 'Field'       },
  { kind: 'Argument',            label: 'Argument'    },
  { kind: 'Variable',            label: 'Variable'    },
  { kind: 'Directive',           label: 'Directive'   },
];

// ─── Main Component ────────────────────────────────────────────────────
interface ASTExplorerProps {
  query: string;
}

export function ASTExplorer({ query }: ASTExplorerProps) {
  const [parseError, setParseError] = useState<string | null>(null);

  const tree = useMemo<TreeNode | null>(() => {
    try {
      const doc = parse(query);
      setParseError(null);
      return buildTree(doc);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Parse error');
      return null;
    }
  }, [query]);

  const isEmpty = !query.trim();

  return (
    <div style={{
      background: '#fff',
      border: 'var(--border)',
      boxShadow: 'var(--shadow-md)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: 'var(--border-2)',
        background: '#f9f5f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#000' }}>
          🌳 AST Explorer
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#6B7280',
          background: '#e5e7eb', padding: '2px 8px', borderRadius: 999,
        }}>
          Abstract Syntax Tree
        </span>
      </div>

      {/* What is an AST banner */}
      <div style={{
        padding: '10px 16px',
        background: '#EEF2FF',
        borderBottom: 'var(--border-2)',
        fontSize: 11.5, fontWeight: 600, color: '#374151', lineHeight: 1.65,
      }}>
        <strong style={{ color: '#4338CA' }}>What is this?</strong>{' '}
        When GraphQL receives your query, the first thing it does is <strong>parse</strong> it into an{' '}
        <strong>Abstract Syntax Tree (AST)</strong> — a structured tree of objects representing every token in your query.
        Click any node to expand it.
      </div>

      {/* Legend */}
      <div style={{
        padding: '8px 16px',
        borderBottom: 'var(--border-2)',
        background: '#fafafa',
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Node types:
        </span>
        {LEGEND.map(l => (
          <span
            key={l.kind}
            style={{
              fontSize: 9.5, fontWeight: 700, color: '#000',
              background: getColor(l.kind),
              border: '1.5px solid #000',
              borderRadius: 999,
              padding: '2px 8px',
            }}
          >
            {l.label}
          </span>
        ))}
      </div>

      {/* Tree content */}
      <div style={{ padding: '16px 18px', minHeight: 180, overflowX: 'auto' }}>
        {isEmpty && (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '28px 0', fontSize: 12, fontWeight: 600 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌳</div>
            Write a GraphQL query above — the AST will appear here live.
          </div>
        )}

        {parseError && !isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '10px 14px',
              background: '#FEE2E2',
              border: '2px solid #000',
              boxShadow: '3px 3px 0 #000',
              borderRadius: 8,
              fontSize: 11.5, fontWeight: 700, color: '#000', lineHeight: 1.55,
            }}
          >
            <span style={{ fontWeight: 900 }}>⚠️ Parse Error</span> — Fix your query syntax:
            <br />
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#991b1b' }}>{parseError}</code>
          </motion.div>
        )}

        {tree && !parseError && (
          <ASTNodeCard node={tree} defaultOpen />
        )}
      </div>
    </div>
  );
}
