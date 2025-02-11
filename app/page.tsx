"use client"

import LinuxTerminalSimulator from "../LinuxTerminalSimulator"
import Script from 'next/script'

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Linux 终端模拟器",
    "description": "一个基于 Next.js 和 AI 的 Web 端 Linux 终端模拟器，支持常用 Linux 命令。",
    "applicationCategory": "教育工具",
    "operatingSystem": "Web 浏览器",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CNY"
    },
    "featureList": [
      "支持基本的 Linux 命令模拟",
      "实时命令响应",
      "命令输出格式化显示",
      "内置命令别名支持"
    ]
  }

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LinuxTerminalSimulator />
    </>
  )
}