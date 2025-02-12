"use client"

import LinuxTerminalSimulator from "../LinuxTerminalSimulator"
import Script from 'next/script'

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Linux 终端模拟器",
    "description": "一个基于 Next.js 和 AI 的 Web 端 Linux 终端模拟器，支持常用 Linux 命令和多样化的 ASCII 艺术生成。",
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
      "内置命令别名支持",
      "支持 cowsay 命令生成多种可爱的 ASCII 字符画（企鹅、猫咪、狗狗等）",
      "AI 驱动的智能命令输出生成"
    ],
    "keywords": "Linux,终端模拟器,命令行,Web 终端,Linux 学习,Next.js,AI,cowsay,ASCII art,Tux,企鹅字符画,猫咪字符画,狗狗字符画"
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