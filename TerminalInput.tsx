import type React from "react"
import type { KeyboardEvent } from "react"

interface TerminalInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (command: string) => void
  disabled?: boolean
}

export function TerminalInput({ value, onChange, onSubmit, disabled }: TerminalInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled) {
      onSubmit(value)
    }
  }

  return (
    <div className="flex items-center">
      <span className="text-green-400 mr-2 text-sm sm:text-base">$</span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className="bg-transparent text-white focus:outline-none flex-grow font-mono text-sm sm:text-base w-full"
        autoFocus
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        autoComplete="off"
        placeholder="输入命令..."
        disabled={disabled}
      />
    </div>
  )
}

