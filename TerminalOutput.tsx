import { forwardRef, ReactNode } from "react"
import ReactMarkdown from 'react-markdown'

interface TerminalOutputProps {
  history: string[]
}

interface ComponentProps {
  children: ReactNode;
  [key: string]: any;
}

export const TerminalOutput = forwardRef<HTMLDivElement, TerminalOutputProps>(({ history }, ref) => {
  // 处理输出行，移除空行并优化格式
  const processOutputLines = (lines: string[]) => {
    return lines.reduce((acc: string[], line: string, index: number) => {
      // 如果是命令行（以 $ 开头），直接添加
      if (line.startsWith('$')) {
        acc.push(line);
        return acc;
      }
      
      // 对于非命令行，检查是否是空行
      const isEmptyLine = line.trim() === '';
      const prevLine = index > 0 ? lines[index - 1] : '';
      const isPrevCommandLine = prevLine.startsWith('$');
      
      // 如果是空行，只在命令行之后保留一个空行
      if (isEmptyLine) {
        if (isPrevCommandLine) {
          acc.push(line);
        }
        return acc;
      }
      
      acc.push(line);
      return acc;
    }, []);
  };

  // 检查是否为 ASCII 艺术输出
  const isAsciiArt = (line: string) => {
    return line.includes('\\') || line.includes('/') || line.includes('_') || 
           line.includes('|') || line.includes('-') || line.includes('(') || 
           line.includes(')') || line.startsWith('<') || line.endsWith('>');
  };

  const processedHistory = processOutputLines(history);

  return (
    <div 
      ref={ref} 
      className="text-white font-mono mb-4 flex-1 overflow-y-auto min-h-0"
    >
      <div className="w-full">
        {processedHistory.map((line, index) => (
          <div key={index} className="break-words whitespace-pre-wrap">
            {line.startsWith('$') ? (
              // 命令输入行使用绿色
              <span className="text-green-400">{line}</span>
            ) : isAsciiArt(line) ? (
              // ASCII 艺术输出保持白色
              <span>{line}</span>
            ) : (
              // 其他行使用 markdown 渲染，但保持简单的终端风格
              <ReactMarkdown
                components={{
                  // 移除段落的额外样式
                  p: ({ children }) => (
                    <span className="block leading-tight">{children}</span>
                  ),
                  // 保持代码块的终端风格
                  code: ({ children }) => (
                    <span className="text-green-400">{children}</span>
                  ),
                  // 保持预格式化文本的样式
                  pre: ({ children }) => (
                    <span className="block whitespace-pre-wrap break-words">{children}</span>
                  ),
                  // 简化列表样式，减少间距
                  ul: ({ children }) => (
                    <div className="ml-4">{children}</div>
                  ),
                  li: ({ children }) => (
                    <div className="flex items-start">
                      <span className="mr-2 text-gray-500">•</span>
                      <span className="flex-1">{children}</span>
                    </div>
                  ),
                  // 移除标题样式
                  h1: ({ children }) => (
                    <span className="block text-yellow-400">{children}</span>
                  ),
                  h2: ({ children }) => (
                    <span className="block text-yellow-400">{children}</span>
                  ),
                  h3: ({ children }) => (
                    <span className="block text-yellow-400">{children}</span>
                  ),
                  // 简化表格样式
                  table: ({ children }) => (
                    <div className="my-1 w-full overflow-x-auto">{children}</div>
                  ),
                  thead: ({ children }) => <div>{children}</div>,
                  tbody: ({ children }) => <div>{children}</div>,
                  tr: ({ children }) => (
                    <div className="flex flex-wrap">{children}</div>
                  ),
                  th: ({ children }) => (
                    <span className="px-2 text-yellow-400">{children}</span>
                  ),
                  td: ({ children }) => (
                    <span className="px-2">{children}</span>
                  ),
                }}
              >
                {line}
              </ReactMarkdown>
            )}
          </div>
        ))}
      </div>
    </div>
  )
})

TerminalOutput.displayName = "TerminalOutput"

