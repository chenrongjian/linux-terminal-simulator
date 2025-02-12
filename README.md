# Linux 终端模拟器

一个基于 Next.js 和通义千问大模型的 Web 端 Linux 终端模拟器。

## 功能特点

- 支持基本的 Linux 命令模拟
- 美观的终端界面
- 实时命令响应
- 命令输出格式化显示
- 内置命令别名支持（如：ll、la）
- 丰富的趣味命令支持
  - ASCII 字符画生成（cowsay）
  - 动态火车动画（sl）
  - 唐诗生成器（fortune）
  - 矩阵雨效果（cmatrix）
  - ASCII 水族箱（asciiquarium）
  - 系统监控仪表盘（dashboard）
  - 可爱猫咪动画（oneko）
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
- 趣味命令：
  - cowsay：生成 ASCII 字符画小动物说话
    - cowsay Hello World     # 生成 Tux 企鹅
    - cowsay cat Hello       # 生成猫咪
    - cowsay dog Woof       # 生成狗狗
  - sl：显示一辆动态的小火车动画
  - fortune：随机生成一首优美的唐诗
  - cmatrix：显示黑客帝国风格的矩阵雨效果
  - asciiquarium：显示动态水族箱动画，包含游动的鱼、气泡和水草
  - dashboard：显示炫酷的系统监控仪表盘，包含 CPU、内存、网络等动态图表
  - oneko：显示一只可爱的 ASCII 猫咪动画
    - 输入 oneko 命令显示/隐藏猫咪
    - 猫咪会跟随鼠标移动
    - 停止移动鼠标 3 秒后，猫咪会进入睡眠状态
    - 再次输入 oneko 命令可以关闭猫咪动画
    - 猫咪会自动保持在终端窗口内活动

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