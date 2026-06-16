import * as React from 'react';

export interface CardProps {
  children: React.ReactNode;
  /** Add a subtle raised shadow + brightness shift on hover */
  hoverable?: boolean;
  className?: string;
}

/**
 * Surface card — bg-surface, hairline border-border, rounded-md.
 * Optional raised hover (shadow-raised). Depth via luminance steps,
 * never raw shadow by default (DESIGN.md: "shadow means 'this floats'").
 */
export function Card({ children, hoverable = false, className }: CardProps) {
  return (
    <div
      className={[
        'bg-surface border border-border rounded-md',
        hoverable &&
          [
            'transition-shadow duration-(--metador-duration-fast)',
            'hover:shadow-raised cursor-pointer',
          ].join(' '),
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
