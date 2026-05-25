import React, { useState } from 'react';
import { User, Users, Building2, Crown, ChevronDown, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrgChartNode {
  id: number;
  name: string;
  /** Secondary line shown under the name (position, dept code, member count…) */
  subtitle?: string;
  role: 'admin' | 'manager' | 'teamlead' | 'employee' | 'department';
  department?: string;
  avatar?: string;
  /** Index into DEPT_PALETTES — set for role === 'department' nodes */
  deptIndex?: number;
  children?: OrgChartNode[];
  reports?: number;
}

interface OrgChartProps {
  data: OrgChartNode;
  className?: string;
}

// ─── Palettes ─────────────────────────────────────────────────────────────────

const DEPT_PALETTES = [
  { top: 'bg-blue-500',    av: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700',       border: 'border-blue-200',    card: 'bg-blue-50'    },
  { top: 'bg-emerald-500', av: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200', card: 'bg-emerald-50' },
  { top: 'bg-violet-500',  av: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700',   border: 'border-violet-200',  card: 'bg-violet-50'  },
  { top: 'bg-orange-500',  av: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700',   border: 'border-orange-200',  card: 'bg-orange-50'  },
  { top: 'bg-pink-500',    av: 'bg-pink-500',    badge: 'bg-pink-100 text-pink-700',       border: 'border-pink-200',    card: 'bg-pink-50'    },
  { top: 'bg-cyan-500',    av: 'bg-cyan-500',    badge: 'bg-cyan-100 text-cyan-700',       border: 'border-cyan-200',    card: 'bg-cyan-50'    },
] as const;

const ROLE_PALETTES: Record<string, {
  top: string; av: string; badge: string; border: string; card: string; label: string;
}> = {
  admin:    { top: 'bg-purple-600', av: 'bg-purple-600', badge: 'bg-purple-100 text-purple-700', border: 'border-purple-200', card: 'bg-purple-50',  label: 'Admin'     },
  manager:  { top: 'bg-amber-500',  av: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700',   border: 'border-amber-200',  card: 'bg-amber-50',   label: 'Manager'   },
  teamlead: { top: 'bg-rose-500',   av: 'bg-rose-500',   badge: 'bg-rose-100 text-rose-700',     border: 'border-rose-200',   card: 'bg-rose-50',    label: 'Team Lead' },
  employee: { top: 'bg-slate-400',  av: 'bg-slate-500',  badge: 'bg-slate-100 text-slate-600',   border: 'border-slate-200',  card: 'bg-slate-50',   label: 'Employee'  },
};

function getStyle(node: OrgChartNode) {
  if (node.role === 'department') {
    const p = DEPT_PALETTES[(node.deptIndex ?? 0) % DEPT_PALETTES.length];
    return { ...p, label: node.department || 'Dept' };
  }
  return ROLE_PALETTES[node.role] ?? ROLE_PALETTES.employee;
}

function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0] ?? '')
      .join('')
      .toUpperCase() || '?'
  );
}

function RoleIcon({ role }: { role: string }) {
  switch (role) {
    case 'admin':
      return <Crown className="w-2.5 h-2.5" />;
    case 'manager':
    case 'department':
      return <Building2 className="w-2.5 h-2.5" />;
    case 'teamlead':
      return <Users className="w-2.5 h-2.5" />;
    default:
      return <User className="w-2.5 h-2.5" />;
  }
}

// ─── NodeCard ─────────────────────────────────────────────────────────────────

const NodeCard: React.FC<{
  node: OrgChartNode;
  collapsed: boolean;
  onToggle: () => void;
}> = ({ node, collapsed, onToggle }) => {
  const s = getStyle(node);
  const hasKids = (node.children?.length ?? 0) > 0;

  return (
    <div
      className={[
        'relative rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200',
        'min-w-[170px] max-w-[210px] overflow-hidden',
        s.card, s.border,
      ].join(' ')}
    >
      {/* Coloured top accent */}
      <div className={`h-1.5 w-full ${s.top}`} />

      <div className="p-3 pt-2.5">
        {/* Avatar + name row */}
        <div className="flex items-start gap-2.5 mb-2">
          <div
            className={[
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
              'text-white text-xs font-bold shadow-sm',
              s.av,
            ].join(' ')}
          >
            {getInitials(node.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {node.name}
            </div>
            {node.subtitle && (
              <div className="text-[11px] text-gray-500 truncate mt-0.5 leading-tight">
                {node.subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Badge + expand toggle */}
        <div className="flex items-center justify-between gap-1">
          <span
            className={[
              'inline-flex items-center gap-1 text-[10px] font-semibold',
              'px-1.5 py-0.5 rounded-full uppercase tracking-wide',
              s.badge,
            ].join(' ')}
          >
            <RoleIcon role={node.role} />
            {s.label}
          </span>

          {hasKids && (
            <button
              onClick={onToggle}
              className="p-0.5 rounded hover:bg-black/10 transition-colors text-gray-400 hover:text-gray-600"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Reports count */}
        {node.reports !== undefined && node.reports > 0 && (
          <div className="mt-1.5 text-[10px] text-gray-400 flex items-center gap-1">
            <Users className="w-2.5 h-2.5" />
            {node.reports} report{node.reports !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TreeNode ─────────────────────────────────────────────────────────────────
//
// Connector strategy
// ──────────────────
// Single child:   vertical drop  →  child (straight)
//
// Multiple children:
//
//    [Parent]
//       │          ← vertical drop  (w-px h-5 bg-gray-300)
//    ───┼───        ← T-bar (built from left/right flex-1 segments with border-t)
//    │     │        ← vertical drops inside child wrappers
//  [C1]  [C2]
//
// Each child wrapper has a "T-bar row":
//   [left flex-1 with border-t (skipped for first)] | [w-px h-5 vertical] | [right flex-1 with border-t (skipped for last)]
//
// Because flex-1 fills half the wrapper on each side, the bar naturally runs
// from the centre of the leftmost child to the centre of the rightmost child,
// with no JS measurement required.
// ─────────────────────────────────────────────────────────────────────────────

const LINE = 'bg-gray-300';

const TreeNode: React.FC<{ node: OrgChartNode; level: number }> = ({ node, level }) => {
  const [collapsed, setCollapsed] = useState(false);
  const kids = !collapsed ? (node.children ?? []) : [];

  return (
    <div className="flex flex-col items-center">
      <NodeCard
        node={node}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      {kids.length > 0 && (
        <>
          {/* Vertical drop from card to bar/child */}
          <div className={`w-px h-5 ${LINE}`} />

          {kids.length === 1 ? (
            /* Single child — straight vertical */
            <TreeNode node={kids[0]} level={level + 1} />
          ) : (
            /* Multiple children — T-bar */
            <div className="flex items-start">
              {kids.map((child, i) => {
                const isFirst = i === 0;
                const isLast = i === kids.length - 1;

                return (
                  <div key={child.id} className="flex flex-col items-center">
                    {/* T-bar connector row */}
                    <div className="flex items-start h-5 w-full">
                      {/* Left horizontal segment (missing for first child) */}
                      <div
                        className={`flex-1 h-px self-center ${
                          isFirst ? '' : 'bg-gray-300'
                        }`}
                      />
                      {/* Vertical drop */}
                      <div className={`w-px h-5 shrink-0 ${LINE}`} />
                      {/* Right horizontal segment (missing for last child) */}
                      <div
                        className={`flex-1 h-px self-center ${
                          isLast ? '' : 'bg-gray-300'
                        }`}
                      />
                    </div>

                    {/* Child node (horizontal padding separates siblings) */}
                    <div className="px-3">
                      <TreeNode node={child} level={level + 1} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Root component ───────────────────────────────────────────────────────────

const OrgChart: React.FC<OrgChartProps> = ({ data, className = '' }) => (
  <div className={`overflow-auto py-6 ${className}`}>
    {/* min-w-max prevents the flex-center from collapsing the tree */}
    <div className="flex justify-center min-w-max mx-auto px-6">
      <TreeNode node={data} level={0} />
    </div>
  </div>
);

export default OrgChart;
