'use client';

/**
 * MarkdownRenderer — client component wrapping react-markdown.
 * Uses the "use client" boundary so rehype plugins can run in browser context.
 * Mermaid fences are rendered via lazy MermaidDiagram.
 * External links open in new tab. Internal /docs links navigate in-place.
 */
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';
import type { ExtraProps } from 'react-markdown';
import { MermaidDiagram } from './MermaidDiagram';

// We load a minimal highlight.js CSS override inline via the globals (tokens only).
// The actual class injection is done by rehype-highlight; colors map to our tokens.

interface MarkdownRendererProps {
  content: string;
}

type CodeProps = React.ComponentPropsWithoutRef<'code'> & ExtraProps;

function CodeBlock({ children, className, ...props }: CodeProps) {
  const lang = /language-(\w+)/.exec(className ?? '')?.[1] ?? '';
  const code = String(children).replace(/\n$/, '');

  if (lang === 'mermaid') {
    return <MermaidDiagram chart={code} />;
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components: Components = {
    // Headings — display serif for h1/h2, sans for h3+
    h1: ({ children, ...props }) => (
      <h1
        className="font-display font-semibold text-2xl text-text mt-0 mb-4 leading-tight"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="font-display font-semibold text-xl text-text mt-8 mb-3 leading-tight scroll-mt-24"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="font-text font-medium text-lg text-text mt-6 mb-2 leading-tight scroll-mt-24"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="font-text font-medium text-base text-text mt-4 mb-2 scroll-mt-24"
        {...props}
      >
        {children}
      </h4>
    ),

    // Body
    p: ({ children, ...props }) => (
      <p
        className="text-base text-text leading-relaxed mb-4"
        {...props}
      >
        {children}
      </p>
    ),

    // Lists
    ul: ({ children, ...props }) => (
      <ul
        className="list-disc list-inside mb-4 space-y-1 text-base text-text leading-relaxed pl-4"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal list-inside mb-4 space-y-1 text-base text-text leading-relaxed pl-4"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-base text-text leading-relaxed" {...props}>
        {children}
      </li>
    ),

    // Links — internal /docs links stay in app; external open new tab
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith('http') || href?.startsWith('//');
      return (
        <a
          href={href}
          className="text-primary hover:text-primary-bright underline underline-offset-2 decoration-primary/40 hover:decoration-primary transition-colors duration-(--metador-duration-fast) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg rounded-xs"
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          {...props}
        >
          {children}
        </a>
      );
    },

    // Code — inline + blocks
    code: CodeBlock,

    pre: ({ children, ...props }) => (
      <div className="relative group mb-4">
        <pre
          className="rounded-md border border-border bg-surface p-4 overflow-x-auto text-sm font-mono leading-relaxed"
          style={{ color: 'var(--metador-text)' }}
          {...props}
        >
          {children}
        </pre>
      </div>
    ),

    // Blockquote
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-2 border-primary pl-4 my-4 text-muted italic"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Tables
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto mb-6">
        <table
          className="w-full text-sm border-collapse"
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead
        className="border-b border-border"
        {...props}
      >
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th
        className="text-left text-2xs font-medium text-muted uppercase tracking-wider px-3 py-2"
        {...props}
      >
        {children}
      </th>
    ),
    tbody: ({ children, ...props }) => (
      <tbody
        className="divide-y divide-border"
        {...props}
      >
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }) => (
      <tr
        className="hover:bg-raised/50 transition-colors duration-(--metador-duration-fast)"
        {...props}
      >
        {children}
      </tr>
    ),
    td: ({ children, ...props }) => (
      <td
        className="px-3 py-2 text-sm text-text"
        {...props}
      >
        {children}
      </td>
    ),

    // Horizontal rule
    hr: (props) => (
      <hr
        className="border-0 border-t border-border my-8"
        {...props}
      />
    ),

    // Strong + em
    strong: ({ children, ...props }) => (
      <strong className="font-medium text-text" {...props}>{children}</strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic text-muted" {...props}>{children}</em>
    ),
  };

  return (
    <article className="docs-prose min-w-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          rehypeHighlight,
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
