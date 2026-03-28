"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ReadmeViewer({ content }: { content: string }) {
  // Strip the first H1 line since Navbar already shows the title
  const trimmed = content.replace(/^#\s+.+\n+/, "");

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <style>{`
        .readme pre, .readme pre code {
          font-family: 'Courier New', Courier, monospace !important;
          font-size: 13px;
          line-height: 1.45;
        }
      `}</style>
      <article className="readme prose prose-neutral max-w-none prose-pre:bg-[#fafafa] prose-pre:text-foreground prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:shadow-sm prose-pre:overflow-x-auto prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{trimmed}</ReactMarkdown>
      </article>
    </div>
  );
}
