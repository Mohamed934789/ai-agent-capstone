import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownRenderer({ content }: { content: string }) {
  const parsedContent = content.replace(/\\n/g, '\n');
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsedContent}</ReactMarkdown>;
}