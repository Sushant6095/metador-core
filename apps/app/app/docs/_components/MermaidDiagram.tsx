'use client';

/**
 * MermaidDiagram — client component for rendering mermaid fences.
 * Dynamic import of mermaid keeps it out of the server bundle.
 * Reduced-motion: renders the static SVG with no entrance animation.
 * Matches DESIGN.md dark theme (bg = --metador-bg, accent = --metador-primary).
 */
import * as React from 'react';

interface MermaidDiagramProps {
  chart: string;
}

let mermaidInitialized = false;

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);
  const id = React.useId().replace(/:/g, '');

  React.useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;

        if (!mermaidInitialized) {
          // mermaid's JS theme API takes literal color strings (it cannot read
          // CSS vars), so resolve the live --metador-* tokens off the document
          // root — keeps tokens the single source of truth (no raw hex here) and
          // tracks the active theme.
          const css = getComputedStyle(document.documentElement);
          const t = (name: string) => css.getPropertyValue(name).trim();
          mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: {
              primaryColor: t('--metador-raised'),
              primaryTextColor: t('--metador-text'),
              primaryBorderColor: t('--metador-border'),
              lineColor: t('--metador-muted'),
              secondaryColor: t('--metador-surface'),
              tertiaryColor: t('--metador-surface'),
              background: t('--metador-bg'),
              mainBkg: t('--metador-surface'),
              nodeBorder: t('--metador-border'),
              clusterBkg: t('--metador-surface'),
              titleColor: t('--metador-text'),
              edgeLabelBackground: t('--metador-raised'),
              attributeBackgroundColorEven: t('--metador-surface'),
              attributeBackgroundColorOdd: t('--metador-raised'),
            },
            fontFamily: t('--metador-font-text') || 'system-ui, sans-serif',
            fontSize: 13,
            flowchart: { curve: 'basis', htmlLabels: true },
          });
          mermaidInitialized = true;
        }

        const { svg: rendered } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart, id]);

  if (error) {
    return (
      <div
        className="rounded-md border border-border p-4 text-sm text-muted font-mono"
        aria-label="Diagram could not be rendered"
      >
        <pre className="overflow-x-auto whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        className="rounded-md border border-border bg-surface h-32 animate-skeleton"
        aria-label="Loading diagram"
        role="status"
      />
    );
  }

  return (
    <div
      className="my-6 rounded-md border border-border bg-surface p-4 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-label="Architecture diagram"
    />
  );
}
