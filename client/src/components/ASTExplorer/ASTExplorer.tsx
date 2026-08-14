import { useState, useMemo, useEffect } from 'react';
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

interface ASTExplanation {
  title: string;
  role: string;
  serverBehavior: string;
  tip: string;
}

// ─── Educational Explanations per AST Kind ──────────────────────────────
const AST_EXPLANATIONS: Record<string, ASTExplanation> = {
  Document: {
    title: 'Document (Root Container)',
    role: 'The root container for an entire GraphQL query document sent from the client.',
    serverBehavior: 'The GraphQL engine parses this into memory and validates all operations against the schema.',
    tip: 'A document can contain multiple queries, mutations, or fragment definitions.',
  },
  OperationDefinition: {
    title: 'OperationDefinition',
    role: 'Declares whether this operation is a Query (read), Mutation (write), or Subscription (event stream).',
    serverBehavior: 'The engine selects the designated operation and starts executing its top-level SelectionSet.',
    tip: 'Anonymous operations are allowed, but naming operations (e.g. query GetStudent) is best practice.',
  },
  SelectionSet: {
    title: 'SelectionSet { … }',
    role: 'A grouped list of fields to fetch on the current object type.',
    serverBehavior: 'The engine resolves sibling fields within a selection set concurrently using Promise.all().',
    tip: 'Empty selection sets are invalid in GraphQL — an object field MUST select at least one scalar leaf field.',
  },
  Field: {
    title: 'Field Node',
    role: 'A specific data property requested by the client (e.g. name, age, courses).',
    serverBehavior: 'The server invokes the field resolver function: Resolver(parent, args, context, info).',
    tip: 'Fields that are omitted in the query will NEVER execute on the server, saving CPU and DB load.',
  },
  Argument: {
    title: 'Argument Node',
    role: 'Input parameters passed into a field (e.g. id: "1", limit: 5).',
    serverBehavior: 'The server coerces inputs to declared GraphQL types and passes them into `args` in the resolver.',
    tip: 'Arguments can be hardcoded literals or dynamic variables ($id).',
  },
  StringValue: {
    title: 'String Literal',
    role: 'A UTF-8 character string value passed as an argument.',
    serverBehavior: 'Coerced into a JavaScript string before passing to the resolver.',
    tip: 'Enclosed in double quotes ("...").',
  },
  IntValue: {
    title: 'Integer Literal',
    role: 'A signed 32-bit integer scalar value.',
    serverBehavior: 'Coerced into a JavaScript number without decimals.',
    tip: 'GraphQL integers are bounded between -2^31 and 2^31 - 1.',
  },
  Variable: {
    title: 'Variable ($)',
    role: 'A dynamic parameter passed separately in the JSON variables payload.',
    serverBehavior: 'The engine binds the variable value from req.body.variables into the AST tree.',
    tip: 'Variables allow clients to reuse compiled queries without string concatenation.',
  },
  Directive: {
    title: 'Directive (@)',
    role: 'Conditional execution instructions (e.g. @include(if: $flag), @skip, @deprecated).',
    serverBehavior: 'Evaluated during Field Collection before resolvers are invoked.',
    tip: 'Directives let you dynamically toggle fields from client variable flags.',
  },
};

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

  const children: TreeNode[] = [];
  const n = node as unknown as Record<string, unknown>;

  const childOrder = [
    'definitions',
    'selectionSet',
    'selections',
    'arguments',
    'variableDefinitions',
    'directives',
    'type',
    'defaultValue',
    'value',
  ];

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

// ─── Recursive Tree Node Card ────────────────────────────────────────────
function ASTNodeCard({
  node,
  selectedId,
  onSelectNode,
  expandTrigger,
}: {
  node: TreeNode;
  selectedId: string | null;
  onSelectNode: (node: TreeNode) => void;
  expandTrigger: { open: boolean; count: number } | null;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

  // React to global expand/collapse trigger
  useEffect(() => {
    if (expandTrigger !== null) {
      setOpen(expandTrigger.open);
    }
  }, [expandTrigger]);


  return (
    <div style={{ marginLeft: node.depth === 0 ? 0 : 16 }}>
      {/* Node pill */}
      <div
        onClick={() => {
          onSelectNode(node);
          if (hasChildren) {
            setOpen(o => !o);
          }
        }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px',
          borderRadius: 999,
          border: isSelected ? '2.5px solid #000' : '2px solid #000',
          background: node.color,
          boxShadow: isSelected ? '0 0 0 2px #000, 3px 3px 0 #000' : '2px 2px 0 #000',
          cursor: 'pointer',
          marginBottom: 6,
          userSelect: 'none',
          outline: isSelected ? '2px solid #000' : 'none',
          outlineOffset: 1,
        }}
      >

        {/* Expand toggle */}
        {hasChildren && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setOpen(o => !o);
            }}
            style={{
              fontSize: 9, fontWeight: 900, color: '#000', lineHeight: 1,
              padding: '2px 4px', cursor: 'pointer',
            }}
          >
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
            fontSize: 9.5, fontWeight: 700, color: 'rgba(0,0,0,0.6)',
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
            background: 'rgba(0,0,0,0.14)', borderRadius: 999,
            padding: '1px 6px',
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
                <ASTNodeCard
                  key={child.id}
                  node={child}
                  selectedId={selectedId}
                  onSelectNode={onSelectNode}
                  expandTrigger={expandTrigger}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [expandTrigger, setExpandTrigger] = useState<{ open: boolean; count: number } | null>(null);

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

  // Set default selected node to Document when tree loads
  useEffect(() => {
    if (tree && !selectedNode) {
      setSelectedNode(tree);
    }
  }, [tree, selectedNode]);

  const isEmpty = !query.trim();
  const explanation = selectedNode
    ? AST_EXPLANATIONS[selectedNode.kind] || {
        title: selectedNode.kind,
        role: `A ${selectedNode.kind} node in the parsed syntax tree.`,
        serverBehavior: 'Evaluated by the GraphQL engine during AST traversal.',
        tip: 'Each AST node contains source location tokens and metadata.',
      }
    : null;

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
        flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#000', fontFamily: 'var(--font-sans)' }}>
            🌲 Interactive AST Explorer
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: '#e5e7eb', color: '#374151', border: '1.5px solid #000',
          }}>
            Click any node to inspect &amp; toggle
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.button
            onClick={() => setExpandTrigger(prev => ({ open: true, count: (prev?.count ?? 0) + 1 }))}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '4px 10px', borderRadius: 6,
              border: '2px solid #000', background: '#fff',
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              boxShadow: '2px 2px 0 #000',
            }}
          >
            ▼ Expand All
          </motion.button>
          <motion.button
            onClick={() => setExpandTrigger(prev => ({ open: false, count: (prev?.count ?? 0) + 1 }))}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '4px 10px', borderRadius: 6,
              border: '2px solid #000', background: '#fff',
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              boxShadow: '2px 2px 0 #000',
            }}
          >
            ▶ Collapse All
          </motion.button>
        </div>
      </div>


      {/* Explainer banner */}
      <div style={{
        padding: '10px 16px',
        background: '#eff6ff',
        borderBottom: 'var(--border-2)',
        fontSize: 12, color: '#1e40af', lineHeight: 1.5,
      }}>
        <strong>What is this?</strong> When GraphQL receives your query string, it passes it to the <strong>Parser</strong> to produce an <strong>Abstract Syntax Tree (AST)</strong>. The engine validates this tree against the schema and walks it to execute resolvers.
      </div>

      {/* Legend */}
      <div style={{
        padding: '8px 16px',
        borderBottom: 'var(--border-2)',
        display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        background: '#fafafa',
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Node Types:
        </span>
        {LEGEND.map(item => (
          <span key={item.kind} style={{
            fontSize: 10.5, fontWeight: 700,
            padding: '2px 8px', borderRadius: 999,
            background: getColor(item.kind),
            border: '1.5px solid #000',
            color: '#000',
          }}>
            {item.label}
          </span>
        ))}
      </div>

      {/* Main Split Layout: Tree View (Left) + Node Explainer Panel (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 1.4fr) minmax(280px, 1fr)',
        gap: 0,
        minHeight: 320,
      }}>
        {/* Left: Tree Canvas */}
        <div style={{
          padding: '18px 20px',
          overflowX: 'auto',
          background: '#fff',
          borderRight: 'var(--border-2)',
        }}>
          {isEmpty && (
            <p style={{ color: 'var(--text-grey)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
              Enter a query above to see its parsed AST.
            </p>
          )}

          {parseError && (
            <div style={{
              padding: '12px 14px', borderRadius: 8,
              background: '#fee2e2', border: '2px solid #ef4444',
              color: '#991b1b', fontSize: 12, fontFamily: 'var(--font-mono)',
            }}>
              <strong>Syntax Error:</strong> {parseError}
            </div>
          )}

          {tree && (
            <ASTNodeCard
              node={tree}
              selectedId={selectedNode?.id ?? null}
              onSelectNode={setSelectedNode}
              expandTrigger={expandTrigger}
            />
          )}
        </div>

        {/* Right: Interactive Node Inspector & Educational Explainer */}
        <div style={{
          padding: '16px 18px',
          background: '#FFFDF9',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 900, color: '#000',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>🔍</span> Node Inspector
          </div>

          {explanation && selectedNode ? (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              {/* Selected node badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 999,
                background: selectedNode.color, border: '2px solid #000',
                boxShadow: '2px 2px 0 #000', alignSelf: 'flex-start',
              }}>
                <span style={{ fontSize: 11.5, fontWeight: 900, color: '#000', fontFamily: 'var(--font-mono)' }}>
                  {selectedNode.label}
                </span>
                <span style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.7 }}>
                  ({selectedNode.kind})
                </span>
              </div>

              {/* Title & Role */}
              <div style={{
                background: '#fff', border: '2px solid #000', borderRadius: 8,
                padding: '10px 12px', boxShadow: '2px 2px 0 #000',
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#000', marginBottom: 4 }}>
                  📌 Role in Query:
                </div>
                <div style={{ fontSize: 11.5, color: '#374151', lineHeight: 1.5 }}>
                  {explanation.role}
                </div>
              </div>

              {/* Server Behavior */}
              <div style={{
                background: '#F0FDF4', border: '2px solid #000', borderRadius: 8,
                padding: '10px 12px', boxShadow: '2px 2px 0 #000',
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#166534', marginBottom: 4 }}>
                  ⚙️ How the Server Executes It:
                </div>
                <div style={{ fontSize: 11.5, color: '#14532d', lineHeight: 1.5 }}>
                  {explanation.serverBehavior}
                </div>
              </div>

              {/* Tip */}
              <div style={{
                background: '#FEF9C3', border: '2px solid #000', borderRadius: 8,
                padding: '10px 12px', boxShadow: '2px 2px 0 #000',
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#854D0E', marginBottom: 4 }}>
                  💡 Pro-Tip:
                </div>
                <div style={{ fontSize: 11.5, color: '#713F12', lineHeight: 1.5 }}>
                  {explanation.tip}
                </div>
              </div>
            </motion.div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-grey)', textAlign: 'center', padding: '40px 0' }}>
              Click any node in the tree on the left to inspect how GraphQL executes it!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
