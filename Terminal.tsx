"use client"

import { useState, useRef, useEffect } from "react"
import { TerminalInput } from "./TerminalInput"
import { TerminalOutput } from "./TerminalOutput"
import { simulateLinuxCommand } from "./lib/api"

// 内置命令列表
const BUILT_IN_COMMANDS = ['help', 'clear'];

export function Terminal() {
  const [history, setHistory] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  const handleCommand = async (command: string) => {
    const cmd = command.toLowerCase();
    setHistory((prev) => [...prev, `$ ${command}`])
    
    // 内置命令处理
    if (BUILT_IN_COMMANDS.includes(cmd)) {
      switch (cmd) {
        case "clear":
          setHistory([])
          break
        case "help":
          setHistory((prev) => [...prev, 
            "可用命令:",
            "- help: 显示帮助信息",
            "- clear: 清空终端",
            "- 其他标准 Linux 命令将通过 AI 模拟执行"
          ])
          break
      }
      setInputValue("")
      return;
    }

    // 外部命令处理
    setIsProcessing(true)

    try {
      const response = await simulateLinuxCommand(command)
      setHistory((prev) => [...prev, response])
    } catch (error) {
      setHistory((prev) => [...prev, `错误: ${error}`])
    } finally {
      setIsProcessing(false)
      setInputValue("")
    }
  }

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [history])

  return (
    <div className="w-full max-w-3xl bg-gray-800 rounded-lg shadow-lg overflow-hidden mx-auto my-4 md:my-8">
      <div className="bg-gray-700 px-2 sm:px-4 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="ml-2 sm:ml-4 text-white font-mono text-sm sm:text-base">Terminal</div>
        </div>
        {isProcessing && (
          <div className="text-yellow-400 text-sm animate-pulse">
            处理中...
          </div>
        )}
      </div>
      <div className="p-2 sm:p-4">
        <TerminalOutput history={history} ref={outputRef} />
        <TerminalInput 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          onSubmit={handleCommand}
          disabled={isProcessing} 
        />
      </div>
    </div>
  )
}

