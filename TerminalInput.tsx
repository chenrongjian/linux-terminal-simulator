import type React from "react"
import type { KeyboardEvent } from "react"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"

interface TerminalInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (command: string) => void
  disabled?: boolean
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ value, onChange, onSubmit, disabled }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    useEffect(() => {
      inputRef.current?.focus()
    }, [value])

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !disabled) {
        onSubmit(value)
      }
    }

    return (
      <div className="flex items-center mt-2">
        <span className="text-green-400 mr-2 text-sm sm:text-base flex-shrink-0">$</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          className="bg-transparent text-white focus:outline-none flex-1 font-mono text-sm sm:text-base min-w-0"
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
)

