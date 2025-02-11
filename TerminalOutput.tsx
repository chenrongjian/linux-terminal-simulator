import { forwardRef } from "react"

interface TerminalOutputProps {
  history: string[]
}

export const TerminalOutput = forwardRef<HTMLDivElement, TerminalOutputProps>(({ history }, ref) => {
  return (
    <div ref={ref} className="text-white font-mono mb-4 h-64 overflow-y-auto">
      {history.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  )
})

TerminalOutput.displayName = "TerminalOutput"

