import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import type { Element, Root } from 'hast';

// Custom rehype plugin to add Tailwind CSS classes
function rehypeAddTailwindClasses() {
  return (tree: Root) => {
    function visit(node: any) {
      if (node.type === 'element') {
        const element = node as Element;
        
        // Add classes based on element type
        switch (element.tagName) {
          case 'h1':
            element.properties = { 
              ...element.properties, 
              className: 'text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100' 
            };
            break;
          case 'h2':
            element.properties = { 
              ...element.properties, 
              className: 'text-2xl font-semibold mb-4 mt-8 text-gray-900 dark:text-gray-100' 
            };
            break;
          case 'h3':
            element.properties = { 
              ...element.properties, 
              className: 'text-xl font-medium mb-3 mt-6 text-gray-900 dark:text-gray-100' 
            };
            break;
          case 'h4':
            element.properties = { 
              ...element.properties, 
              className: 'text-lg font-medium mb-2 mt-4 text-gray-900 dark:text-gray-100' 
            };
            break;
          case 'p':
            element.properties = { 
              ...element.properties, 
              className: 'mb-4 text-gray-700 dark:text-gray-300' 
            };
            break;
          case 'strong':
            // Let prose handle styling, don't override
            break;
          case 'em':
            element.properties = { 
              ...element.properties, 
              className: 'italic' 
            };
            break;
          case 'code':
            // Check if it's inline code (not inside a pre)
            const isInlinecode = !element.properties?.className?.includes('language-');
            if (isInlinecode) {
              element.properties = { 
                ...element.properties, 
                className: 'bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono' 
              };
            }
            break;
          case 'pre':
            element.properties = { 
              ...element.properties, 
              className: 'bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4' 
            };
            // Style the code inside pre
            if (element.children) {
              element.children.forEach((child: any) => {
                if (child.type === 'element' && child.tagName === 'code') {
                  child.properties = { 
                    ...child.properties, 
                    className: 'text-sm font-mono' 
                  };
                }
              });
            }
            break;
          case 'ul':
            element.properties = { 
              ...element.properties, 
              className: 'mb-4 space-y-1 text-gray-700 dark:text-gray-300 text-left' 
            };
            break;
          case 'ol':
            element.properties = { 
              ...element.properties, 
              className: 'mb-4 space-y-1 text-gray-700 dark:text-gray-300 list-decimal list-inside text-left' 
            };
            break;
          case 'li':
            // Handle task list items (checkboxes)
            const hasTaskInput = element.children?.some((child: any) => 
              child.type === 'element' && child.tagName === 'input' && child.properties?.type === 'checkbox'
            );
            
            if (hasTaskInput) {
              element.properties = { 
                ...element.properties, 
                className: 'mb-1 flex items-start text-left' 
              };
              
              // Style the checkbox and text
              element.children?.forEach((child: any, index: number) => {
                if (child.type === 'element' && child.tagName === 'input') {
                  const isChecked = child.properties?.checked;
                  // Replace checkbox with custom styled span
                  element.children![index] = {
                    type: 'element',
                    tagName: 'span',
                    properties: {
                      className: isChecked 
                        ? 'inline-flex items-center justify-center w-4 h-4 mr-2 mt-0.5 bg-green-500 border-2 border-green-500 rounded text-white text-xs leading-none'
                        : 'inline-block w-4 h-4 mr-2 mt-0.5 border-2 border-gray-300 dark:border-gray-600 rounded'
                    },
                    children: isChecked ? [{ type: 'text', value: '✓' }] : []
                  };
                  
                  // Add strikethrough to checked items
                  if (isChecked && index + 1 < element.children!.length) {
                    const nextChild = element.children![index + 1];
                    if (nextChild.type === 'text') {
                      element.children![index + 1] = {
                        type: 'element',
                        tagName: 'span',
                        properties: { className: 'line-through text-gray-500' },
                        children: [nextChild]
                      };
                    }
                  }
                }
              });
            } else {
              element.properties = { 
                ...element.properties, 
                className: 'mb-1 ml-6 text-left' 
              };
            }
            break;
          case 'table':
            element.properties = { 
              ...element.properties, 
              className: 'w-full border-collapse border border-gray-300 dark:border-gray-600 mb-4' 
            };
            break;
          case 'th':
            element.properties = { 
              ...element.properties, 
              className: 'border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-700 font-semibold text-left' 
            };
            break;
          case 'td':
            element.properties = { 
              ...element.properties, 
              className: 'border border-gray-300 dark:border-gray-600 px-3 py-2' 
            };
            break;
          case 'blockquote':
            element.properties = { 
              ...element.properties, 
              className: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 text-gray-600 dark:text-gray-400 italic' 
            };
            break;
          case 'a':
            element.properties = { 
              ...element.properties, 
              className: 'text-blue-600 dark:text-blue-400 hover:underline' 
            };
            break;
        }
      }
      
      // Recursively visit children
      if (node.children) {
        node.children.forEach(visit);
      }
    }
    
    visit(tree);
  };
}

/**
 * Process markdown content into styled HTML using remark/rehype pipeline
 * @param content - Raw markdown content
 * @returns Promise<string> - Styled HTML string
 */
export async function processMarkdown(content: string): Promise<string> {
  const file = await unified()
    .use(remarkParse) // Parse markdown
    .use(remarkGfm) // Support GitHub Flavored Markdown (tables, task lists, etc.)
    .use(remarkRehype) // Convert to HTML AST
    .use(rehypeAddTailwindClasses) // Add our custom Tailwind classes
    .use(rehypeSanitize) // Sanitize HTML
    .use(rehypeStringify) // Convert to HTML string
    .process(content);
    
  return String(file);
}

/**
 * Read a markdown file from the filesystem and process it
 * @param filePath - Path to the markdown file
 * @returns Promise<string> - Processed HTML content, or empty string if file not found
 */
export async function readAndProcessMarkdownFile(filePath: string): Promise<string> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const fullPath = path.join(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return await processMarkdown(content);
  } catch (error) {
    console.error(`Failed to read markdown file: ${filePath}`, error);
    return '';
  }
}