import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Linux 终端模拟器 | 在线体验 Linux 命令',
  description: '一个基于 Next.js 和 AI 的 Web 端 Linux 终端模拟器，支持常用 Linux 命令，提供实时响应和格式化输出。适合学习和体验 Linux 命令行操作。',
  keywords: 'Linux, 终端模拟器, 命令行, Web 终端, Linux 学习, Next.js, AI',
  authors: [{ name: 'chenrongjian' }],
  openGraph: {
    title: 'Linux 终端模拟器 | 在线体验 Linux 命令',
    description: '一个基于 Next.js 和 AI 的 Web 端 Linux 终端模拟器，支持常用 Linux 命令。',
    type: 'website',
    locale: 'zh_CN',
    url: 'https://linux-terminal-simulator.vercel.app'
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  verification: {
    google: 'QfYGSzH1pxteLvqL0cx80PIKI2pVmzConq9wYXhduwE'
  },
  alternates: {
    canonical: 'https://linux-terminal-simulator.vercel.app'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
