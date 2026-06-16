'use client';

import * as React from 'react';
import { Button, BrassSpinner, Modal } from '@metador/ui';
import { DURATIONS_S } from '@metador/design-system';
import { useHoldToConfirm } from './use-hold-to-confirm';

/**
 * RevokeDialog — the REVOKE moment (DESIGN.md #motion, the demo's emotional
 * peak). Implements beat 1 (Arm) here; the parent owns beats 2 (Commit) and 3
 * (Settle) once `onCommitted` fires.
 *
 *   Arm    — this dialog over the --metador-overlay scrim (Modal handles the
 *            320ms scale/opacity enter). The confirm button is --metador-revoke
 *            fill; an 800ms hold-to-confirm sweeps a brass→revoke fill across
 *            it (transform: scaleX only). Releasing early cancels, no effect.
 *   Commit — on hold-complete we "submit" the (mocked) revoke tx. The button
 *            shows a brass spinner ("Revoking…"). After a short mock delay it
 *            resolves SUCCESS and calls onCommitted(); the parent flips the
 *            badge/meter/feed (beats 2+3).
 *
 * FAILURE PATH (funds-path moment — required, DESIGN.md). Mocked here behind a
 * `forceOutcome` hook so the demo can show all three: success, wallet-reject
 * (dialog stays open, muted "Signature cancelled — nothing changed" note), and
 * on-chain abort (a --metador-tint-danger banner with a human reason; badge does
 * NOT flip). Reduced-motion = instant; the hold still gates the commit.
 *
 * TODO(G1): replace `mockRevokeTx` with the real PTB — build the
 * `vault::revoke` MoveCall, dryRun + display effects, request signature via
 * dapp-kit, await on-chain confirmation, map aborts through
 * docs/abort-codes.md. The visual choreography below is final; only the tx
 * plumbing is mocked.
 */

const HOLD_MS = 800; // DESIGN.md beat-1 friction
const MOCK_TX_MS = 900; // stand-in for sign + confirm wait

type Outcome = 'success' | 'reject' | 'abort';
type Phase = 'armed' | 'committing' | 'rejected' | 'aborted';

export interface RevokeDialogProps {
  open: boolean;
  vaultName: string;
  onClose: () => void;
  /** Called on confirmed on-chain success — parent runs Commit + Settle. */
  onCommitted: () => void;
  /**
   * Demo control for the failure path. Default 'success'. The page wires a
   * hidden owner-only toggle so the red-team beat can be filmed live.
   */
  forceOutcome?: Outcome;
}

// ENotOwner = code 7 (vault module) per docs/abort-codes.md.
const ABORT_REASON =
  'Only the vault owner can revoke or reclaim. (E_NOT_OWNER, code 7) — nothing changed.';

export function RevokeDialog({
  open,
  vaultName,
  onClose,
  onCommitted,
  forceOutcome = 'success',
}: RevokeDialogProps) {
  const [phase, setPhase] = React.useState<Phase>('armed');
  const txTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const reduceMotion = useReducedMotion();

  // The hold ramp owns its own progress; on completion it fires handleComplete.
  // We keep the latest callback in a ref so the hold's onComplete identity is
  // stable and we never need a deps-exhaustiveness escape hatch.
  const onCommittedRef = React.useRef(onCommitted);
  onCommittedRef.current = onCommitted;
  const forceOutcomeRef = React.useRef(forceOutcome);
  forceOutcomeRef.current = forceOutcome;

  const hold = useHoldToConfirm(reduceMotion ? 1 : HOLD_MS, () => {
    setPhase('committing');
    txTimer.current = setTimeout(
      () => {
        const outcome = forceOutcomeRef.current;
        if (outcome === 'reject') setPhase('rejected');
        else if (outcome === 'abort') setPhase('aborted');
        else onCommittedRef.current();
      },
      reduceMotion ? 0 : MOCK_TX_MS,
    );
  }, phase === 'armed');

  const resetHold = hold.reset;

  // A failure outcome returns the hold to its armed-idle fill.
  React.useEffect(() => {
    if (phase === 'rejected' || phase === 'aborted') resetHold();
  }, [phase, resetHold]);

  // Reset all state whenever the dialog (re)opens.
  React.useEffect(() => {
    if (open) {
      setPhase('armed');
      resetHold();
    }
    return () => {
      if (txTimer.current) clearTimeout(txTimer.current);
    };
  }, [open, resetHold]);

  const committing = phase === 'committing';
  // Sweep covers the button left→right as the hold progresses (scaleX only).
  const sweep = committing ? 1 : hold.progress;

  return (
    <Modal
      open={open}
      onClose={committing ? () => {} : onClose}
      title={`Revoke ${vaultName}`}
      description="Revoking the leader's trading capability is permanent and cannot be undone."
    >
      <div className="p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-2xs font-medium uppercase tracking-widest text-revoke">
            Irreversible action
          </span>
          <h2
            className="text-xl font-medium leading-tight"
            style={{ color: 'var(--metador-text)' }}
          >
            This cannot be undone.
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Revoking destroys the leader&apos;s{' '}
            <span className="font-code text-xs text-text">TradeCap</span> for{' '}
            <span className="text-text font-medium">{vaultName}</span> on-chain.
            The leader loses all trading authority immediately and the
            capability cannot be recreated. Deposits remain yours to withdraw.
          </p>
        </div>

        {/* Failure-path surfaces */}
        {phase === 'rejected' && (
          <p
            className="text-xs text-muted"
            role="status"
            aria-live="polite"
          >
            Signature cancelled — nothing changed.
          </p>
        )}
        {phase === 'aborted' && (
          <div
            className="rounded-md border border-danger/40 px-3 py-2"
            style={{ backgroundColor: 'var(--metador-tint-danger)' }}
            role="alert"
          >
            <p className="text-xs text-danger leading-relaxed">{ABORT_REASON}</p>
          </div>
        )}

        {/* The hold-to-confirm revoke button */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={committing}
            aria-label={`Press and hold to revoke ${vaultName}`}
            {...hold.handlers}
            className={[
              'relative overflow-hidden w-full select-none',
              'rounded-sm px-4 py-3 text-sm font-semibold',
              'text-on-revoke',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-raised',
              'disabled:cursor-wait',
            ].join(' ')}
            style={{
              // Base layer is brass; the revoke fill sweeps over it.
              backgroundColor: 'var(--metador-primary-deep)',
              touchAction: 'none',
            }}
          >
            {/* Revoke fill sweep — scaleX from origin-left, transform only. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 origin-left"
              style={{
                backgroundColor: 'var(--metador-revoke)',
                transform: `scaleX(${sweep})`,
                transition: hold.holding
                  ? 'none'
                  : `transform ${DURATIONS_S.fast}s var(--metador-ease-exit)`,
              }}
            />
            <span className="relative flex items-center justify-center gap-2">
              {committing ? (
                <>
                  <BrassSpinner />
                  Revoking…
                </>
              ) : (
                <>Press &amp; hold to revoke</>
              )}
            </span>
          </button>
          {!committing && (
            <p className="text-2xs text-faint text-center">
              Hold for {Math.round(HOLD_MS / 100) / 10}s · release to cancel
            </p>
          )}
        </div>

        {!committing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="self-center"
          >
            Cancel
          </Button>
        )}
      </div>
    </Modal>
  );
}

/** Reduced-motion preference (SSR-safe). */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}
