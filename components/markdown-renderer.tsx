import { processMarkdown } from '@/lib/utils/markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default async function MarkdownRenderer({ content, className = "prose prose-lg max-w-none" }: MarkdownRendererProps) {
  const processedContent = await processMarkdown(content);
  
  return (
    <div className={className}>
      <div
        dangerouslySetInnerHTML={{
          __html: processedContent,
        }}
      />
    </div>
  );
}