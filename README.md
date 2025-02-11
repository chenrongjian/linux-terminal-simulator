# Linux 终端模拟器

一个基于 Next.js 和通义千问大模型的 Web 端 Linux 终端模拟器。

## 功能特点

- 支持基本的 Linux 命令模拟
- 美观的终端界面
- 实时命令响应
- 命令输出格式化显示
- 内置命令别名支持（如：ll、la）
- 安全性保护（禁止危险命令）
- 速率限制保护

## 技术栈

- 前端框架：Next.js 14
- UI 框架：Tailwind CSS
- 大模型：通义千问 Qwen2.5-Coder-7B-Instruct
- 部署平台：Vercel

## 本地开发

1. 克隆项目
```bash
git clone https://github.com/你的用户名/linux-terminal-simulator.git
cd linux-terminal-simulator
```

2. 安装依赖
```bash
npm install --legacy-peer-deps
```

3. 配置环境变量
创建 `.env.local` 文件并添加以下配置：
```
DEEPSEEK_API_KEY=你的API密钥
AI_MODEL_API_URL=https://api.siliconflow.cn/v1/chat/completions
AI_MODEL_NAME=Qwen/Qwen2.5-Coder-7B-Instruct
AI_MODEL_MAX_TOKENS=512
```

4. 启动开发服务器
```bash
npm run dev
```

## 支持的命令

- 基本文件操作：ls、pwd、cd 等
- 文本操作：cat、echo 等
- 内置命令：help、clear
- 命令别名：
  - ll = ls -l
  - la = ls -la
  - l = ls -lah

## 部署

项目已配置为可以直接部署到 Vercel 平台：

1. Fork 本仓库
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 完成部署

## 注意事项

- API 密钥请妥善保管，不要泄露
- 本项目仅用于学习和演示目的
- 某些 Linux 命令可能不完全支持或行为可能与真实系统有差异

## 开源协议

MIT License 