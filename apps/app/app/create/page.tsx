'use client';

import { useState } from 'react';
import { Button, PolicyCard } from '@metador/ui';
import { DEEPBOOK_TESTNET } from '@metador/deepbook';

// ── Types ─────────────────────────────────────────────────────────────────────

type StrategyKind = 'delegate' | 'dca';

interface WizardState {
  strategy: StrategyKind | null;
  pool: string;
  budgetRaw: string;
  expiry: '24h' | '7d' | '30d';
}

const EMPTY_WIZARD: WizardState = {
  strategy: null,
  pool: 'SUI/DBUSDC',
  budgetRaw: '',
  expiry: '7d',
};

const POOLS = [
  { label: 'SUI / DBUSDC', value: 'SUI/DBUSDC', id: DEEPBOOK_TESTNET.POOL_SUI_DBUSDC },
  { label: 'DEEP / SUI', value: 'DEEP/SUI', id: DEEPBOOK_TESTNET.POOL_DEEP_SUI },
];

const EXPIRY_OPTIONS: { label: string; value: WizardState['expiry'] }[] = [
  { label: '24 hours', value: '24h' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
];

function expiryToMs(expiry: WizardState['expiry']): number {
  const ms: Record<WizardState['expiry'], number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  return Date.now() + ms[expiry];
}

function poolQuoteSymbol(pool: string): 'SUI' | 'DBUSDC' {
  return pool === 'DEEP/SUI' ? 'SUI' : 'DBUSDC';
}

// ── Step 1: Strategy selection ────────────────────────────────────────────────

function StrategyCard({
  kind,
  selected,
  onSelect,
}: {
  kind: StrategyKind;
  selected: boolean;
  onSelect: () => void;
}) {
  const configs = {
    delegate: {
      title: 'Delegate',
      description:
        'Grant the leader a mandate to trade on your behalf within the policy walls. The leader acts autonomously; your ceiling limits every trade.',
      tag: 'Active trading',
    },
    dca: {
      title: 'DCA',
      description:
        'Dollar-cost average into a pool on a fixed schedule. The cranker executes each tick; your budget ceiling caps total spend.',
      tag: 'Scheduled',
    },
  };
  const { title, description, tag } = configs[kind];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'w-full text-left rounded-md border p-4 flex flex-col gap-2',
        'transition-[background-color,border-color,color] duration-(--metador-duration-fast)',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-surface hover:border-muted hover:bg-raised',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <span
          className={[
            'text-base font-semibold',
            selected ? 'text-primary' : 'text-text',
          ].join(' ')}
          style={{ fontFamily: 'var(--metador-font-display)' }}
        >
          {title}
        </span>
        <span className="text-2xs font-medium uppercase tracking-widest text-muted border border-border rounded-xs px-1.5 py-0.5">
          {tag}
        </span>
      </div>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
      {selected && (
        <div className="flex items-center gap-1.5 text-xs text-primary font-medium mt-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Selected
        </div>
      )}
    </button>
  );
}

// ── Step 2: Policy walls form ─────────────────────────────────────────────────

function PolicyWallsStep({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (next: WizardState) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Wall 1: Pool scope */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="create-pool-select"
          className="text-xs font-medium uppercase tracking-widest text-muted"
        >
          Wall 1 — Scope (pool)
        </label>
        <select
          id="create-pool-select"
          value={state.pool}
          onChange={(e) => onChange({ ...state, pool: e.target.value })}
          className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm text-text font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors duration-(--metador-duration-fast)"
        >
          {POOLS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-faint">
          The vault can only trade this pool. The scope wall is enforced on-chain.
        </p>
      </div>

      {/* Wall 2: Budget ceiling */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="create-budget-input"
          className="text-xs font-medium uppercase tracking-widest text-muted"
        >
          Wall 2 — Budget ceiling ({poolQuoteSymbol(state.pool)})
        </label>
        <div className="relative">
          <input
            id="create-budget-input"
            type="number"
            min="0"
            step="any"
            value={state.budgetRaw}
            onChange={(e) => onChange({ ...state, budgetRaw: e.target.value })}
            placeholder="e.g. 1000"
            className="w-full bg-raised border border-border rounded-sm px-3 py-2 pr-20 text-sm text-text font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors duration-(--metador-duration-fast) [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-faint pointer-events-none">
            {poolQuoteSymbol(state.pool)}
          </span>
        </div>
        <p className="text-xs text-faint">
          Maximum the leader can spend across all trades. Enforced by the on-chain
          policy — cannot be raised without revoking and recreating.
        </p>
      </div>

      {/* Wall 3: Expiry */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium uppercase tracking-widest text-muted">
          Wall 3 — Expiry
        </label>
        <div className="flex gap-2 flex-wrap">
          {EXPIRY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...state, expiry: opt.value })}
              aria-pressed={state.expiry === opt.value}
              className={[
                'px-3 py-1.5 rounded-sm text-sm font-medium border transition-colors duration-(--metador-duration-fast)',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                state.expiry === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-raised text-muted hover:border-muted hover:text-text',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-faint">
          After expiry the vault automatically becomes inoperable. The leader
          cannot extend it.
        </p>
      </div>

      {/* Wall 4: Revocable — always on, shown as fact */}
      <div className="flex flex-col gap-2 p-3 rounded-md bg-raised border border-border">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="text-primary shrink-0">
            <path d="M2 7s1.5-4 5-4 5 4 5 4-1.5 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-widest text-muted">
            Wall 4 — Revocable (always on)
          </span>
        </div>
        <p className="text-xs text-faint">
          You can revoke the leader&apos;s capability in one click at any time. This
          is non-negotiable — it is the depositor&apos;s ultimate safety guarantee.
        </p>
      </div>
    </div>
  );
}

// ── Step 3: Review ────────────────────────────────────────────────────────────

function ReviewStep({ state }: { state: WizardState }) {
  const quoteSymbol = poolQuoteSymbol(state.pool);
  const budgetFormatted =
    state.budgetRaw !== '' && Number(state.budgetRaw) > 0
      ? state.budgetRaw
      : '—';

  const expiresAtMs = expiryToMs(state.expiry);

  return (
    <div className="flex flex-col gap-6">
      <div className="p-3 rounded-md bg-raised border border-border flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-widest text-muted">
          Strategy
        </span>
        <span className="text-sm text-text font-medium">
          {state.strategy === 'delegate' ? 'Delegate' : 'DCA'}
        </span>
      </div>

      {/* Live PolicyCard from chosen values */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted mb-3">
          Policy preview
        </h2>
        <PolicyCard
          pool={state.pool}
          budgetFormatted={budgetFormatted}
          quoteSymbol={quoteSymbol}
          expiresAtMs={expiresAtMs}
          revocable
          status="active"
        />
      </div>

      <p className="text-xs text-faint leading-relaxed">
        Review the policy card above — this is exactly what will be recorded on
        Sui. Once signed, the walls cannot be softened without revoking and
        recreating the vault.
      </p>

      {/* Disabled sign button (G1) */}
      <Button variant="primary" size="md" disabled className="w-full sm:w-auto">
        Sign &amp; create (G1)
      </Button>
      <p className="text-xs text-faint -mt-4">
        On-chain creation wires to{' '}
        <span className="font-mono">keel_core</span> in G1.
      </p>
    </div>
  );
}

// ── Wizard steps indicator ────────────────────────────────────────────────────

interface StepDef {
  value: '1' | '2' | '3';
  label: string;
}

const WIZARD_STEPS: StepDef[] = [
  { value: '1', label: '1. Strategy' },
  { value: '2', label: '2. Policy walls' },
  { value: '3', label: '3. Review & sign' },
];

/**
 * Stepper indicator — renders as a list with aria-current="step" on the
 * active step. This is NOT a tablist: the create wizard does not allow free
 * tab selection; forward progress requires explicit "Continue" clicks.
 * Completed steps are clickable only to go back (implemented in step content).
 */
function WizardStepper({
  currentStep,
  onBack,
}: {
  currentStep: '1' | '2' | '3';
  onBack: (step: '1' | '2' | '3') => void;
}) {
  return (
    <nav aria-label="Vault creation steps" className="mb-8">
      <ol
        role="list"
        className="flex items-end gap-0 border-b border-border relative"
      >
        {WIZARD_STEPS.map((s) => {
          const isCurrent = s.value === currentStep;
          const isPast = parseInt(s.value) < parseInt(currentStep);
          return (
            <li key={s.value}>
              {isPast ? (
                <button
                  type="button"
                  onClick={() => onBack(s.value)}
                  aria-current={undefined}
                  className={[
                    'relative px-4 py-2 text-sm font-medium',
                    'transition-colors duration-(--metador-duration-fast)',
                    'text-muted hover:text-text',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                    'rounded-t-xs',
                  ].join(' ')}
                >
                  {s.label}
                </button>
              ) : (
                <span
                  aria-current={isCurrent ? 'step' : undefined}
                  className={[
                    'relative inline-flex px-4 py-2 text-sm font-medium select-none',
                    isCurrent ? 'text-primary' : 'text-faint',
                  ].join(' ')}
                >
                  {s.label}
                  {isCurrent && (
                    <span
                      className="absolute bottom-[-1px] left-0 right-0 h-[2px]"
                      style={{ backgroundColor: 'var(--metador-primary)' }}
                      aria-hidden="true"
                    />
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Create() {
  const [step, setStep] = useState<'1' | '2' | '3'>('1');
  const [wizard, setWizard] = useState<WizardState>(EMPTY_WIZARD);

  const canAdvanceStep1 = wizard.strategy !== null;
  const canAdvanceStep2 =
    wizard.pool !== '' &&
    wizard.budgetRaw !== '' &&
    Number(wizard.budgetRaw) > 0;

  return (
    <section aria-labelledby="create-heading">
      <h1
        id="create-heading"
        className="text-2xl font-semibold text-text mb-6"
        style={{ fontFamily: 'var(--metador-font-display)' }}
      >
        Create Vault
      </h1>

      {/* Steps indicator — stepper pattern, not tablist */}
      <WizardStepper
        currentStep={step}
        onBack={(s) => setStep(s)}
      />

      <div className="max-w-xl">
        {/* Step 1 */}
        {step === '1' && (
          <div className="flex flex-col gap-6">
            <p className="text-sm text-muted leading-relaxed">
              Choose a trading strategy. This determines how the leader can
              interact with DeepBook on your behalf.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StrategyCard
                kind="delegate"
                selected={wizard.strategy === 'delegate'}
                onSelect={() => setWizard((w) => ({ ...w, strategy: 'delegate' }))}
              />
              <StrategyCard
                kind="dca"
                selected={wizard.strategy === 'dca'}
                onSelect={() => setWizard((w) => ({ ...w, strategy: 'dca' }))}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              disabled={!canAdvanceStep1}
              onClick={() => setStep('2')}
              className="self-start"
            >
              Continue to policy walls →
            </Button>
          </div>
        )}

        {/* Step 2 */}
        {step === '2' && (
          <div className="flex flex-col gap-6">
            <PolicyWallsStep state={wizard} onChange={setWizard} />
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('1')}
              >
                ← Back
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!canAdvanceStep2}
                onClick={() => setStep('3')}
              >
                Review &amp; sign →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === '3' && (
          <div className="flex flex-col gap-6">
            <ReviewStep state={wizard} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('2')}
              className="self-start"
            >
              ← Back to policy walls
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
