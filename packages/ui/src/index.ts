/**
 * @metador/ui — Metador shared UI primitives.
 * BOOTSTRAP Phase F — token-first, design-system-backed component library.
 * Apps compose from this package; never fork (CLAUDE.md §11 sync contracts).
 */

// ── Core primitives ────────────────────────────────────────────────────────
export { Button, BrassSpinner } from './button/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './button/Button';

export { Card } from './card/Card';
export type { CardProps } from './card/Card';

export { Stat } from './stat/Stat';
export type { StatProps, StatDelta } from './stat/Stat';

export { Table } from './table/Table';
export type { TableProps, ColumnConfig, ColumnAlign } from './table/Table';

export { DataTable } from './data-table/DataTable';
export type {
  DataTableProps,
  DataColumn,
  DataColumnAlign,
  DataTableSort,
  SortDir,
} from './data-table/DataTable';

export { Modal } from './modal/Modal';
export type { ModalProps } from './modal/Modal';

export {
  ToastProvider,
  useToast,
} from './toast/Toast';
export type { ToastItem, ToastVariant } from './toast/Toast';

export { Tabs, tabPanelId } from './tabs/Tabs';
export type { TabsProps, TabItem } from './tabs/Tabs';

export { Skeleton } from './skeleton/Skeleton';
export type { SkeletonProps, SkeletonVariant } from './skeleton/Skeleton';

export { ChartShell } from './chart/ChartShell';
export type { ChartShellProps, ChartAspect } from './chart/ChartShell';

// ── Metador native brand components ───────────────────────────────────────────
export { PolicyCard } from './policy-card/PolicyCard';
export type { PolicyCardProps } from './policy-card/PolicyCard';

export { BudgetMeter, computeFillPercent } from './budget-meter/BudgetMeter';
export type { BudgetMeterProps } from './budget-meter/BudgetMeter';

export { ActivityRow } from './activity-row/ActivityRow';
export type { ActivityRowProps, ActivityKind } from './activity-row/ActivityRow';

export { AddressPill } from './address-pill/AddressPill';
export type { AddressPillProps } from './address-pill/AddressPill';

// ── Logo ───────────────────────────────────────────────────────────────────
export { MetadorMark, MetadorLogo } from './logo/MetadorLogo';
