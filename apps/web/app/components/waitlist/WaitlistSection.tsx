'use client';

/**
 * WaitlistSection — email capture.
 * Client-side only: validates email shape, fires analytics, swaps to confirmation.
 * No backend — state-only. TODO: wire to a serverless endpoint / mailing-list provider.
 * METADOR_EVENTS.waitlistJoined is the only analytics event emitted (registry only,
 * CLAUDE.md sync contract).
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { DURATIONS_S, EASE_ENTER } from '@metador/design-system';
import { track, METADOR_EVENTS } from '@metador/analytics';

type FormState = 'idle' | 'submitting' | 'done' | 'error';

function isValidEmail(value: string): boolean {
  // RFC 5322-lite pattern: sufficient for client-side gate.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function WaitlistSection() {
  const reducedMotion = useReducedMotion();
  const [email, setEmail] = React.useState('');
  const [formState, setFormState] = React.useState<FormState>('idle');
  const [validationMsg, setValidationMsg] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const errorId = 'waitlist-email-error';
  // Timer ref for post-submit confirmation delay; cleared on unmount.
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mounted flag so the setState below is never called after unmount.
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (validationMsg) setValidationMsg('');
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setValidationMsg('Enter a valid email address.');
      inputRef.current?.focus();
      return;
    }

    setFormState('submitting');

    // Fire analytics (registry-only event — no inline event name)
    track(METADOR_EVENTS.waitlistJoined, { source: 'landing' });

    // Client-side only — no backend call. Simulate a brief delay then confirm.
    // TODO: replace with POST to a mailing-list endpoint (Resend / ConvertKit / etc.)
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (mountedRef.current) setFormState('done');
    }, 600);
  }

  return (
    <section
      id="waitlist"
      aria-labelledby="waitlist-heading"
      data-theme="light"
      style={{
        padding: 'var(--metador-space-24) var(--metador-space-4)',
        backgroundColor: 'var(--metador-bg)',
        borderTop: '1px solid var(--metador-border)',
      }}
    >
      <div
        className="mx-auto w-full max-w-2xl text-center"
        style={{ maxWidth: 640 }}
      >
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: DURATIONS_S.slow, ease: EASE_ENTER }}
        >
          <p
            className="metador-eyebrow"
            style={{ marginBottom: 'var(--metador-space-2)' }}
          >
            Early access
          </p>
          <h2
            id="waitlist-heading"
            style={{
              fontFamily: 'var(--metador-font-display)',
              fontSize: 'clamp(1.8rem, 4vw + 0.5rem, var(--metador-text-3xl))',
              lineHeight: 'var(--metador-text-3xl--line-height)',
              fontWeight: 'var(--metador-weight-semibold)',
              color: 'var(--metador-text)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--metador-space-4)',
            }}
          >
            Join the waitlist.
          </h2>
          <p
            style={{
              fontFamily: 'var(--metador-font-text)',
              fontSize: 'var(--metador-text-base)',
              lineHeight: 'var(--metador-text-base--line-height)',
              color: 'var(--metador-muted)',
              marginBottom: 'var(--metador-space-8)',
            }}
          >
            Metador is on testnet. Mainnet access goes to the waitlist first.
          </p>

          {formState === 'done' ? (
            <motion.div
              initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATIONS_S.base, ease: EASE_ENTER }}
              role="status"
              aria-live="polite"
              style={{
                backgroundColor: 'var(--metador-tint-success)',
                border: '1px solid var(--metador-success)',
                borderRadius: 'var(--metador-radius-md)',
                padding: 'var(--metador-space-6)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--metador-font-display)',
                  fontSize: 'var(--metador-text-lg)',
                  fontWeight: 'var(--metador-weight-semibold)',
                  color: 'var(--metador-success)',
                  marginBottom: 'var(--metador-space-1)',
                }}
              >
                You&apos;re on the list.
              </p>
              <p
                style={{
                  fontFamily: 'var(--metador-font-text)',
                  fontSize: 'var(--metador-text-sm)',
                  color: 'var(--metador-muted)',
                }}
              >
                Testnet invites first — we&apos;ll reach out when your slot is ready.
              </p>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              aria-label="Waitlist signup"
              noValidate
            >
              <div
                className="flex gap-2 flex-wrap justify-center"
                style={{ gap: 'var(--metador-space-2)' }}
              >
                <div className="flex-1" style={{ minWidth: 220 }}>
                  <label htmlFor="waitlist-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    ref={inputRef}
                    id="waitlist-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={handleChange}
                    aria-describedby={validationMsg ? errorId : undefined}
                    aria-invalid={validationMsg ? 'true' : undefined}
                    disabled={formState === 'submitting'}
                    style={{
                      width: '100%',
                      fontFamily: 'var(--metador-font-text)',
                      fontSize: 'var(--metador-text-base)',
                      color: 'var(--metador-text)',
                      backgroundColor: 'var(--metador-raised)',
                      border: `1px solid ${validationMsg ? 'var(--metador-danger)' : 'var(--metador-border)'}`,
                      borderRadius: 'var(--metador-radius-sm)',
                      padding: 'var(--metador-space-3) var(--metador-space-4)',
                      outline: 'none',
                      transitionDuration: 'var(--metador-duration-fast)',
                      transitionProperty: 'border-color, box-shadow',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = 'none';
                      e.currentTarget.style.boxShadow =
                        `0 0 0 var(--metador-ring-width) var(--metador-ring)`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  {validationMsg && (
                    <p
                      id={errorId}
                      role="alert"
                      style={{
                        fontFamily: 'var(--metador-font-text)',
                        fontSize: 'var(--metador-text-xs)',
                        color: 'var(--metador-danger)',
                        marginTop: 'var(--metador-space-1)',
                        textAlign: 'left',
                      }}
                    >
                      {validationMsg}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={formState === 'submitting'}
                  aria-busy={formState === 'submitting'}
                  style={{
                    fontFamily: 'var(--metador-font-text)',
                    fontWeight: 'var(--metador-weight-medium)',
                    fontSize: 'var(--metador-text-base)',
                    backgroundColor: 'var(--metador-primary)',
                    color: 'var(--metador-on-primary)',
                    border: 'none',
                    borderRadius: 'var(--metador-radius-sm)',
                    padding: 'var(--metador-space-3) var(--metador-space-6)',
                    cursor: formState === 'submitting' ? 'wait' : 'pointer',
                    transitionDuration: 'var(--metador-duration-fast)',
                    transitionProperty: 'background-color, opacity',
                    opacity: formState === 'submitting' ? 0.7 : 1,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (formState !== 'submitting') {
                      e.currentTarget.style.backgroundColor =
                        'var(--metador-primary-bright)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--metador-primary)';
                  }}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  {formState === 'submitting' ? 'Joining…' : 'Join waitlist'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
