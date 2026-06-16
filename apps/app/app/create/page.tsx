'use client';

import { useState } from 'react';
import { Button, PolicyCard } from '@metador/ui';
import { DEEPBOOK_TESTNET } from '@metador/deepbook';

// ── Types ─────────────────────────────────────────────────────────────────────

type StrategyKind = 'delegate' | 'dca';
type ExpiryOption = '24h' | '7d' | '30d';

interface WizardState {
  strategy: StrategyKind | null;
  pool: string;
  budgetRaw: string;
  expiry: ExpiryOption;
}

interface ValidationErrors {
  budget?: string;
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

const EXPIRY_OPTIONS: { label: string; value: ExpiryOption }[] = [
  { label: '24 hours', value: '24h' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
];

const STRATEGY_CONFIGS: Record<
  StrategyKind,
  { title: string; description: string; tag: string }
> = {
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

function expiryToMs(expiry: ExpiryOption): number {
  const ms: Record<ExpiryOption, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  return Date.now() + ms[expiry];
}

function poolQuoteSymbol(pool: string): 'SUI' | 'DBUSDC' {
  return pool === 'DEEP/SUI' ? 'SUI' : 'DBUSDC';
}

function validateBudget(raw: string): string | undefined {
  if (raw === '') return 'Budget ceiling is required.';
  const n = Number(raw);
  if (isNaN(n) || n <= 0) return 'Enter a positive number.';
  if (n > 100_000) return 'Ceiling exceeds 100,000. Reduce for testnet safety.';
  return undefined;
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
  const { title, description, tag } = STRATEGY_CONFIGS[kind];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'w-full text-left rounded-md border p-4 flex flex-col gap-2',
        'transition-[background-color,border-color] duration-(--metador-duration-fast)',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        selected
          ? 'border-primary bg-raised'
          : 'border-border bg-surface hover:border-muted hover:bg-raised',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={[
            'text-base font-medium',
            selected ? 'text-primary' : 'text-text',
          ].join(' ')}
        >
          {title}
        </span>
        <span className="text-2xs font-medium uppercase tracking-widest text-muted border border-border rounded-xs px-1.5 py-0.5 shrink-0">
          {tag}
        </span>
      </div>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
      {selected && (
        <div
          className="flex items-center gap-1.5 text-2xs text-primary font-medium mt-1 uppercase tracking-widest"
          aria-hidden="true"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1.5 5l2.5 2.5 4.5-4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
  errors,
  onChange,
  onBlurBudget,
}: {
  state: WizardState;
  errors: ValidationErrors;
  onChange: (next: WizardState) => void;
  onBlurBudget: () => void;
}) {
  const quoteSymbol = poolQuoteSymbol(state.pool);

  return (
    <div className="flex flex-col gap-6">
      {/* Wall 1: Pool scope */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="create-pool-select"
          className="text-2xs font-medium uppercase tracking-widest text-muted"
        >
          Wall 1 — Scope (pool)
        </label>
        <select
          id="create-pool-select"
          value={state.pool}
          onChange={(e) => onChange({ ...state, pool: e.target.value })}
          className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors duration-(--metador-duration-fast)"
          style={{
            fontFamily: 'var(--metador-font-mono)',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {POOLS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-faint">
          The vault can only trade this pool. Scope is enforced on-chain.
        </p>
      </div>

      {/* Wall 2: Budget ceiling */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="create-budget-input"
          className="text-2xs font-medium uppercase tracking-widest text-muted"
        >
          Wall 2 — Budget ceiling ({quoteSymbol})
        </label>
        <div className="relative">
          <input
            id="create-budget-input"
            type="number"
            min="0"
            step="any"
            value={state.budgetRaw}
            onChange={(e) =>
              onChange({ ...state, budgetRaw: e.target.value })
            }
            onBlur={onBlurBudget}
            placeholder="e.g. 1000"
            aria-describedby={
              errors.budget ? 'budget-error' : 'budget-hint'
            }
            aria-invalid={errors.budget !== undefined}
            className={[
              'w-full bg-raised border rounded-sm px-3 py-2 pr-20 text-sm text-text',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              'transition-colors duration-(--metador-duration-fast)',
              '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              errors.budget ? 'border-danger' : 'border-border',
            ].join(' ')}
            style={{
              fontFamily: 'var(--metador-font-mono)',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-faint pointer-events-none"
            style={{
              fontFamily: 'var(--metador-font-mono)',
            }}
          >
            {quoteSymbol}
          </span>
        </div>
        {errors.budget ? (
          <p
            id="budget-error"
            role="alert"
            className="text-xs text-danger flex items-center gap-1.5"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M6 3.5v3M6 8.5v.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {errors.budget}
          </p>
        ) : (
          <p id="budget-hint" className="text-xs text-faint">
            Maximum the leader can spend across all trades. Cannot be raised
            without revoking and recreating.
          </p>
        )}
      </div>

      {/* Wall 3: Expiry */}
      <div className="flex flex-col gap-2">
        <span className="text-2xs font-medium uppercase tracking-widest text-muted">
          Wall 3 — Expiry
        </span>
        <div role="group" aria-label="Expiry duration" className="flex gap-2 flex-wrap">
          {EXPIRY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...state, expiry: opt.value })}
              aria-pressed={state.expiry === opt.value}
              className={[
                'px-3 py-1.5 rounded-sm text-sm border',
                'transition-colors duration-(--metador-duration-fast)',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                state.expiry === opt.value
                  ? 'border-primary text-primary bg-raised'
                  : 'border-border bg-raised text-muted hover:border-muted hover:text-text',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-faint">
          After expiry the vault becomes inoperable. The leader cannot extend it.
        </p>
      </div>

      {/* Wall 4: Revocable — always on, shown as structural fact */}
      <div className="flex gap-3 p-3 rounded-md bg-raised border border-border">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
          className="text-primary shrink-0 mt-0.5"
        >
          <path
            d="M2 7s1.5-4 5-4 5 4 5 4-1.5 4-5 4-5-4-5-4z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="7" cy="7" r="1.5" fill="currentColor" />
        </svg>
        <div>
          <span className="text-2xs font-medium uppercase tracking-widest text-muted">
            Wall 4 — Revocable (always on)
          </span>
          <p className="text-xs text-faint mt-1">
            You can revoke the leader&apos;s capability in one click at any time.
            Non-negotiable — it is the depositor&apos;s ultimate guarantee.
          </p>
        </div>
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
      {/* Strategy row */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="text-2xs font-medium uppercase tracking-widest text-muted">
          Strategy
        </span>
        <span className="text-sm text-text font-medium">
          {state.strategy === 'delegate' ? 'Delegate' : 'DCA'}
        </span>
      </div>

      {/* Live PolicyCard */}
      <div>
        <h2 className="text-2xs font-medium uppercase tracking-widest text-muted mb-3">
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
        This is exactly what will be recorded on Sui. Once signed, the walls
        cannot be softened without revoking and recreating the vault.
      </p>

      {/* CTA — disabled for G1 */}
      <div className="flex flex-col gap-2">
        <Button variant="primary" size="md" disabled className="w-full sm:w-auto">
          Sign &amp; create (G1)
        </Button>
        <p className="text-xs text-faint">
          On-chain creation wires to{' '}
          <span className="font-code text-xs">keel_core</span> in G1.
        </p>
      </div>
    </div>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────

type StepValue = '1' | '2' | '3';

interface StepDef {
  value: StepValue;
  label: string;
}

const WIZARD_STEPS: StepDef[] = [
  { value: '1', label: 'Strategy' },
  { value: '2', label: 'Policy walls' },
  { value: '3', label: 'Review & sign' },
];

/**
 * Stepper — NOT a tablist. Forward progress requires explicit "Continue" clicks.
 * Completed steps are clickable to go back. aria-current="step" on active.
 */
function WizardStepper({
  currentStep,
  onBack,
}: {
  currentStep: StepValue;
  onBack: (step: StepValue) => void;
}) {
  const current = parseInt(currentStep);

  return (
    <nav aria-label="Vault creation steps" className="mb-8">
      <ol role="list" className="flex items-end border-b border-border">
        {WIZARD_STEPS.map((s, i) => {
          const stepNum = parseInt(s.value);
          const isCurrent = s.value === currentStep;
          const isPast = stepNum < current;

          return (
            <li key={s.value} className="flex items-end gap-0">
              {i > 0 && (
                <span
                  className="mb-2.5 mx-2 text-2xs text-faint"
                  aria-hidden="true"
                >
                  /
                </span>
              )}
              {isPast ? (
                <button
                  type="button"
                  onClick={() => onBack(s.value)}
                  className={[
                    'relative px-1 pb-2.5 text-sm text-muted',
                    'hover:text-text transition-colors duration-(--metador-duration-fast)',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg rounded-xs',
                  ].join(' ')}
                >
                  <span className="text-2xs uppercase tracking-widest mr-1.5 text-faint">
                    {s.value}.
                  </span>
                  {s.label}
                </button>
              ) : (
                <span
                  aria-current={isCurrent ? 'step' : undefined}
                  className={[
                    'relative inline-flex items-center px-1 pb-2.5 text-sm select-none',
                    isCurrent ? 'text-primary font-medium' : 'text-faint',
                  ].join(' ')}
                >
                  <span className="text-2xs uppercase tracking-widest mr-1.5 opacity-70">
                    {s.value}.
                  </span>
                  {s.label}
                  {isCurrent && (
                    <span
                      className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-full"
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
  const [step, setStep] = useState<StepValue>('1');
  const [wizard, setWizard] = useState<WizardState>(EMPTY_WIZARD);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [budgetTouched, setBudgetTouched] = useState(false);

  const canAdvanceStep1 = wizard.strategy !== null;

  function handleBudgetBlur() {
    setBudgetTouched(true);
    setErrors({ ...errors, budget: validateBudget(wizard.budgetRaw) });
  }

  function handleAdvanceStep2() {
    const budgetError = validateBudget(wizard.budgetRaw);
    setBudgetTouched(true);
    if (budgetError) {
      setErrors({ budget: budgetError });
      return;
    }
    setErrors({});
    setStep('3');
  }

  const showBudgetError = budgetTouched
    ? errors.budget
    : undefined;

  return (
    <section aria-labelledby="create-heading">
      {/* Page header */}
      <div className="mb-6">
        <h1
          id="create-heading"
          className="text-2xl font-semibold text-text"
        >
          Create Vault
        </h1>
        <p className="text-sm text-muted mt-1 leading-relaxed">
          Set the four on-chain policy walls — scope, budget, expiry, revocability.
        </p>
      </div>

      {/* Stepper */}
      <WizardStepper
        currentStep={step}
        onBack={(s) => {
          setStep(s);
          setErrors({});
          setBudgetTouched(false);
        }}
      />

      <div className="max-w-xl">
        {/* Step 1 — Strategy */}
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
                onSelect={() =>
                  setWizard((w) => ({ ...w, strategy: 'delegate' }))
                }
              />
              <StrategyCard
                kind="dca"
                selected={wizard.strategy === 'dca'}
                onSelect={() => setWizard((w) => ({ ...w, strategy: 'dca' }))}
              />
            </div>
            {!canAdvanceStep1 && (
              <p className="text-xs text-faint" aria-live="polite">
                Select a strategy to continue.
              </p>
            )}
            <Button
              variant="primary"
              size="md"
              disabled={!canAdvanceStep1}
              onClick={() => setStep('2')}
              className="self-start"
            >
              Continue to policy walls
            </Button>
          </div>
        )}

        {/* Step 2 — Policy walls */}
        {step === '2' && (
          <div className="flex flex-col gap-6">
            <PolicyWallsStep
              state={wizard}
              errors={{ budget: showBudgetError }}
              onChange={(next) => {
                setWizard(next);
                if (budgetTouched) {
                  setErrors({ budget: validateBudget(next.budgetRaw) });
                }
              }}
              onBlurBudget={handleBudgetBlur}
            />
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setStep('1')}>
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleAdvanceStep2}
              >
                Review &amp; sign
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === '3' && (
          <div className="flex flex-col gap-6">
            <ReviewStep state={wizard} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('2')}
              className="self-start"
            >
              Back to policy walls
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
