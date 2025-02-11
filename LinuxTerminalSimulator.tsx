"use client"
import { Terminal } from "./Terminal"

export default function LinuxTerminalSimulator() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 flex items-center justify-center p-4">
      <Terminal />
    </div>
  )
}

