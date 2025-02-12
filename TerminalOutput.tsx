import { forwardRef } from "react"

interface TerminalOutputProps {
  history: string[]
}

export const TerminalOutput = forwardRef<HTMLDivElement, TerminalOutputProps>(({ history }, ref) => {
  return (
    <div 
      ref={ref} 
      className="text-white font-mono mb-4 flex-1 overflow-y-auto whitespace-pre overflow-x-auto min-h-0"
      style={{ scrollbarWidth: 'thin' }}
    >
      {history.map((line, index) => (
        <div key={index} className="min-w-[300px] md:min-w-[600px]">{line}</div>
      ))}
    </div>
  )
})

TerminalOutput.displayName = "TerminalOutput"

