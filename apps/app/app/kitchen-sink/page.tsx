'use client';

import { useState } from 'react';
import {
  ActivityRow,
  AddressPill,
  BudgetMeter,
  Button,
  Card,
  ChartShell,
  Modal,
  PolicyCard,
  Skeleton,
  Stat,
  Table,
  Tabs,
  tabPanelId,
  useToast,
} from '@metador/ui';
import type { ColumnConfig, TabItem } from '@metador/ui';

// ── Theme toggle ──────────────────────────────────────────────────────────────
// The kitchen-sink page toggles data-theme on <html> between "" (dark default)
// and "light". The design-system tokens.css provides both ramps via
// [data-theme="light"] selector. This demonstrates the token layer switching.

function ThemeToggle({ theme, onToggle }: { theme: string; onToggle: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onToggle}>
      {theme === 'light' ? '☀ Light' : '◑ Dark'}
    </Button>
  );
}

// ── Mock data ─────────────────────────────────────────────────────────────────

interface MockRow {
  id: string;
  name: string;
  value: string;
  status: string;
}

const MOCK_ROWS: MockRow[] = [
  { id: '1', name: 'Deep Blue DCA', value: '12,450 SUI', status: 'Live' },
  { id: '2', name: 'Metador Flagship', value: '86,300 DBUSDC', status: 'Live' },
  { id: '3', name: 'Harbor', value: '3,500 SUI', status: 'Revoked' },
];

const TABLE_COLS: ColumnConfig<MockRow>[] = [
  { key: 'name', header: 'Vault', align: 'left', render: (r) => <span>{r.name}</span> },
  {
    key: 'value',
    header: 'TVL',
    align: 'right',
    render: (r) => (
      <span
        className="font-mono text-sm"
        style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
      >
        {r.value}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    align: 'left',
    render: (r) => (
      <span
        className={
          r.status === 'Revoked' ? 'text-revoke text-sm' : 'text-success text-sm'
        }
      >
        {r.status}
      </span>
    ),
  },
];

// ── Toast trigger wrapper ──────────────────────────────────────────────────────
function ToastTriggers() {
  const { addToast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" size="sm" onClick={() => addToast('Trade confirmed on-chain', 'success')}>
        Success toast
      </Button>
      <Button variant="ghost" size="sm" onClick={() => addToast('Transaction rejected by policy: budget exceeded', 'danger')}>
        Danger toast
      </Button>
      <Button variant="ghost" size="sm" onClick={() => addToast('Connecting to DeepBook indexer…', 'info')}>
        Info toast
      </Button>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KitchenSink() {
  const [theme, setTheme] = useState<string>('dark');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    // Flip data-theme on <html> — kitchen-sink scoped toggle
    if (typeof document !== 'undefined') {
      if (next === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  };

  const tabItems: TabItem[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'activity', label: 'Activity' },
    { value: 'policy', label: 'Policy' },
  ];

  return (
    <section aria-labelledby="ks-heading">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1
            id="ks-heading"
            className="text-2xl font-semibold text-text"
            style={{ fontFamily: 'var(--metador-font-display)' }}
          >
            Kitchen Sink — Verify Gate
          </h1>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <p className="text-sm text-muted mb-8 leading-relaxed max-w-2xl">
          Every{' '}
          <span className="font-mono text-xs text-text bg-raised border border-border px-1.5 py-0.5 rounded-xs">
            @metador/ui
          </span>{' '}
          primitive in both themes. Toggle the theme above to exercise the
          dark/light token ramps. The toggle sets{' '}
          <span className="font-mono text-xs text-text bg-raised border border-border px-1.5 py-0.5 rounded-xs">
            data-theme
          </span>{' '}
          on{' '}
          <span className="font-mono text-xs text-text bg-raised border border-border px-1.5 py-0.5 rounded-xs">
            {'<html>'}
          </span>
          .
        </p>

        <div className="flex flex-col gap-12">
          {/* Buttons */}
          <Section title="Button — all variants &amp; states">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="primary" loading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="ghost" disabled>Ghost disabled</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="revoke">Revoke</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="sm">Primary sm</Button>
              <Button variant="ghost" size="sm">Ghost sm</Button>
              <Button variant="danger" size="sm">Danger sm</Button>
            </div>
          </Section>

          {/* Stats */}
          <Section title="Stat — with deltas">
            <div className="grid grid-cols-2 gap-6 p-4 bg-surface rounded-md border border-border sm:grid-cols-4">
              <Stat label="Total TVL" value="12,450 SUI" delta="+3.2%" deltaKind="success" />
              <Stat label="24h Volume" value="1,204 DBUSDC" delta="-0.8%" deltaKind="danger" />
              <Stat label="Active Vaults" value="3" delta="4 total" deltaKind="neutral" />
              <Stat label="Followers" value="351" />
            </div>
          </Section>

          {/* AddressPill */}
          <Section title="AddressPill">
            <div className="flex flex-wrap gap-3 items-center">
              <AddressPill address="0x642a860c2ddcaaf59b59eeb38ef49ad34c8b05c7ab52f459bb9fa02beef30dc7" />
              <AddressPill
                address="0x0f25c3a1e6f282ea0c95faa4518dbaa1607d888a6608d04fbedc408e1e59c608"
                explorerHref="https://suiscan.xyz/testnet/account/0x0f25c3a1e6f282ea0c95faa4518dbaa1607d888a6608d04fbedc408e1e59c608"
              />
              <AddressPill
                address="0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1"
                visible={6}
              />
            </div>
          </Section>

          {/* Table */}
          <Section title="Table — with mock rows">
            <Table<MockRow>
              columns={TABLE_COLS}
              rows={MOCK_ROWS}
              rowKey={(r) => r.id}
              loading={false}
              empty={<span>No rows</span>}
            />
          </Section>

          {/* Table loading */}
          <Section title="Table — loading skeleton">
            <Table<MockRow>
              columns={TABLE_COLS}
              rows={[]}
              rowKey={(r) => r.id}
              loading
              skeletonRows={3}
              empty={<span>No rows</span>}
            />
          </Section>

          {/* Skeleton variants */}
          <Section title="Skeleton — all variants">
            <div className="flex flex-col gap-3 max-w-sm">
              <Skeleton variant="text" />
              <Skeleton variant="row" />
              <Skeleton variant="rect" height="64px" />
            </div>
          </Section>

          {/* Tabs */}
          <Section title="Tabs — with brass indicator">
            <Tabs
              items={tabItems}
              value={activeTab}
              onChange={setActiveTab}
              layoutId="ks-tabs"
            />
            {tabItems.map((tab) => (
              <div
                key={tab.value}
                role="tabpanel"
                id={tabPanelId('ks-tabs', tab.value)}
                aria-labelledby={`ks-tabs-tab-${tab.value}`}
                hidden={tab.value !== activeTab}
                className="pt-3 text-sm text-muted"
              >
                Active tab:{' '}
                <span className="text-primary font-medium">{tab.label}</span>
              </div>
            ))}
          </Section>

          {/* BudgetMeter */}
          <Section title="BudgetMeter — 30% / 85% / 100%">
            <div className="flex flex-col gap-6 max-w-sm">
              <div>
                <p className="text-xs text-faint mb-2">30% — normal</p>
                <BudgetMeter
                  spent={300_000_000_000n}
                  budget={1_000_000_000_000n}
                  quoteDecimals={9}
                  quoteSymbol="SUI"
                />
              </div>
              <div>
                <p className="text-xs text-faint mb-2">85% — warn (icon)</p>
                <BudgetMeter
                  spent={850_000_000_000n}
                  budget={1_000_000_000_000n}
                  quoteDecimals={9}
                  quoteSymbol="SUI"
                />
              </div>
              <div>
                <p className="text-xs text-faint mb-2">100% — locked</p>
                <BudgetMeter
                  spent={1_000_000_000_000n}
                  budget={1_000_000_000_000n}
                  quoteDecimals={9}
                  quoteSymbol="SUI"
                />
              </div>
            </div>
          </Section>

          {/* PolicyCard — active + revoked */}
          <Section title="PolicyCard — active + revoked">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-faint mb-2">Active</p>
                <PolicyCard
                  pool="SUI/DBUSDC"
                  budgetFormatted="25,000"
                  quoteSymbol="DBUSDC"
                  expiresAtMs={Date.now() + 30 * 24 * 60 * 60 * 1000}
                  revocable
                  status="active"
                />
              </div>
              <div>
                <p className="text-xs text-faint mb-2">Revoked</p>
                <PolicyCard
                  pool="DEEP/SUI"
                  budgetFormatted="500"
                  quoteSymbol="SUI"
                  expiresAtMs={Date.now() + 10 * 24 * 60 * 60 * 1000}
                  revocable
                  status="revoked"
                />
              </div>
            </div>
          </Section>

          {/* ActivityRow — all kinds */}
          <Section title="ActivityRow — all kinds">
            <Card className="overflow-hidden">
              <ul>
                <ActivityRow
                  kind="order"
                  title="Placed SUI/DBUSDC order"
                  detail="Side: buy · Qty: 12.00 SUI"
                  timestamp={Date.now() - 1000 * 60 * 5}
                  txHash="0xaaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666000011112222333a"
                />
                <ActivityRow
                  kind="deposit"
                  title="Depositor joined"
                  detail="+500 SUI"
                  timestamp={Date.now() - 1000 * 60 * 15}
                />
                <ActivityRow
                  kind="withdraw"
                  title="Withdrawal processed"
                  detail="-200 SUI"
                  timestamp={Date.now() - 1000 * 60 * 30}
                />
                <ActivityRow
                  kind="rejected"
                  title="Trade rejected by policy: budget exceeded"
                  detail="Attempted spend exceeds ceiling"
                  timestamp={Date.now() - 1000 * 60 * 45}
                />
                <ActivityRow
                  kind="revoked"
                  title="Capability revoked · irreversible"
                  timestamp={Date.now() - 1000 * 60 * 60}
                  txHash="0xbbbb2222cccc3333dddd4444eeee5555ffff6666000011112222333344445556"
                />
              </ul>
            </Card>
          </Section>

          {/* ChartShell */}
          <Section title="ChartShell — placeholder">
            <ChartShell label="NAV — 30d" aspect="3/1" />
          </Section>

          {/* Card */}
          <Section title="Card — default + hoverable">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="p-4">
                <p className="text-sm text-muted">Default card — depth via border + surface luminance step.</p>
              </Card>
              <Card hoverable className="p-4">
                <p className="text-sm text-muted">Hoverable card — shadow-raised on hover.</p>
              </Card>
            </div>
          </Section>

          {/* Modal */}
          <Section title="Modal — focus-trap, scale enter, Escape close">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
            <Modal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Kitchen sink modal"
              description="This modal demonstrates the Motion enter animation, overlay scrim, and focus trap."
            >
              <div className="p-6 flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-text" style={{ fontFamily: 'var(--metador-font-display)' }}>
                  Modal title
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  This modal enters with scale 0.96→1 + opacity 0→1 via{' '}
                  <span className="font-mono text-xs text-faint">--metador-ease-enter</span> at{' '}
                  <span className="font-mono text-xs text-faint">slow (320ms)</span>. Press Escape or click outside to close.
                  Focus is trapped inside.
                </p>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
                    Confirm
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Modal>
          </Section>

          {/* Toast triggers */}
          <Section title="Toast — success / danger / info">
            <ToastTriggers />
          </Section>
        </div>
      </section>
  );
}
