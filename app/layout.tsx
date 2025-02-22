import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Linux 终端模拟器 | 在线体验 Linux 命令和趣味动画效果',
  description: '一个基于 Next.js 和 AI 的 Web 端 Linux 终端模拟器，支持常用 Linux 命令和丰富的趣味功能。包括命令快捷面板（Ctrl+K）、命令分类展示、实时搜索、可拖拽界面，以及 cowsay 生成可爱动物字符画、sl 火车动画、fortune 唐诗生成、cmatrix 黑客帝国特效、asciiquarium 动态水族箱、炫酷系统监控仪表盘、oneko 可爱猫咪动画、精美装饰日历等。提供实时响应和格式化输出，让学习 Linux 变得有趣。',
  keywords: 'Linux, 终端模拟器, 命令行, Web 终端, Linux 学习, Next.js, AI, 命令快捷面板, 命令搜索, 命令分类, cowsay, ASCII art, Tux, 企鹅字符画, 猫咪字符画, 狗狗字符画, sl 火车, fortune 唐诗, cmatrix 矩阵雨, asciiquarium 水族箱, 系统监控仪表盘, oneko 猫咪动画, cal 日历装饰, 动画效果',
  authors: [{ name: 'chenrongjian' }],
  openGraph: {
    title: 'Linux 终端模拟器 | 在线体验 Linux 命令和趣味动画效果',
    description: '一个基于 Next.js 和 AI 的 Web 端 Linux 终端模拟器，支持常用 Linux 命令和丰富的趣味功能。包括命令快捷面板、分类展示、实时搜索，以及字符画生成、动态火车、唐诗生成、矩阵雨、水族箱动画、系统监控仪表盘、可爱猫咪动画、精美装饰日历等特色功能。',
    type: 'website',
    locale: 'zh_CN',
    url: 'https://linux-terminal-simulator.vercel.app'
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    orientation: 'portrait'
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
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="screen-orientation" content="portrait" />
        <meta name="x5-orientation" content="portrait" />
        <meta name="format-detection" content="telephone=no,email=no,address=no" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
