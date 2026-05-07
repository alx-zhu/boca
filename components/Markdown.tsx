"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  p: ({ children }) => (
    <p className="text-[14px] text-[#1a1a1a] leading-[1.6] my-2 first:mt-0 last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#1a1a1a]">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc pl-5 my-2 space-y-1 marker:text-[#9a9a9e]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 my-2 space-y-1 marker:text-[#9a9a9e]">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[14px] leading-[1.6] text-[#1a1a1a]">{children}</li>
  ),
  h1: ({ children }) => (
    <h1 className="text-[16px] font-semibold mt-4 mb-2 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[15px] font-semibold mt-3 mb-1.5 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[14px] font-semibold mt-2 mb-1 first:mt-0">
      {children}
    </h3>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith("language-");
    if (isBlock) {
      return (
        <pre className="my-2 p-3 bg-[#f7f7f8] border border-[#e8e8ea] rounded-md overflow-x-auto">
          <code className="text-[12.5px] font-mono text-[#1a1a1a]">
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code className="px-1 py-0.5 bg-[#f0f0f3] rounded text-[12.5px] font-mono text-[#1a1a1a]">
        {children}
      </code>
    );
  },
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-[#3f3d8a] underline underline-offset-2 hover:text-[#34337a]"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="text-[13px] border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="px-3 py-1.5 border border-[#e8e8ea] bg-[#f7f7f8] font-semibold text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-1.5 border border-[#e8e8ea]">{children}</td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[#e8e8ea] pl-3 my-2 text-[#6b6b70] italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-[#e8e8ea]" />,
};

interface Props {
  children: string;
}

export function Markdown({ children }: Props) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
