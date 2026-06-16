'use client';

/** Keyboard skip-to-main link. Visible only on :focus (keyboard-driven). */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 4,
        zIndex: 9999,
        padding: '8px 16px',
        background: 'var(--metador-primary)',
        color: 'var(--metador-on-primary)',
        fontFamily: 'var(--metador-font-text)',
        fontSize: 'var(--metador-text-sm)',
        borderRadius: 'var(--metador-radius-sm)',
        textDecoration: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '4px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-9999px';
      }}
    >
      Skip to main content
    </a>
  );
}
