"use client"

import LinuxTerminalSimulator from "../LinuxTerminalSimulator"
import Script from 'next/script'

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Linux 终端模拟器",
    "description": "一个基于 Next.js 和 AI 的 Web 端 Linux 终端模拟器，支持常用 Linux 命令和丰富的趣味功能。包括字符画生成、动态火车、唐诗生成、矩阵雨、水族箱动画、系统监控仪表盘等特色功能。",
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
      "动态火车动画效果（sl 命令）",
      "随机唐诗生成器（fortune 命令）",
      "黑客帝国风格矩阵雨（cmatrix 命令）",
      "动态 ASCII 水族箱（asciiquarium 命令）",
      "炫酷系统监控仪表盘（dashboard 命令）",
      "AI 驱动的智能命令输出生成"
    ],
    "keywords": "Linux,终端模拟器,命令行,Web 终端,Linux 学习,Next.js,AI,cowsay,ASCII art,Tux,企鹅字符画,猫咪字符画,狗狗字符画,sl 火车,fortune 唐诗,cmatrix 矩阵雨,asciiquarium 水族箱,系统监控仪表盘,动画效果"
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