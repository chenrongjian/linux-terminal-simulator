import { NextResponse } from 'next/server';
import axios from 'axios';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://cloud.luchentech.com/api/maas/chat/completions';

// 危险命令列表
const DANGEROUS_COMMANDS = [
  'rm', 'mv', 'cp', 'chmod', 'chown', 'sudo', 'su', 
  'dd', 'mkfs', 'fdisk', 'mount', 'umount', 'systemctl',
  'service', 'kill', 'pkill', ':(){:|:&};:', '> /dev/sda'
];

// 检查命令是否安全
function isCommandSafe(command: string): boolean {
  const lowerCmd = command.toLowerCase();
  return !DANGEROUS_COMMANDS.some(dangerCmd => 
    lowerCmd.includes(dangerCmd) || 
    lowerCmd.includes('`') || 
    lowerCmd.includes('$(') ||
    lowerCmd.includes('|') ||
    lowerCmd.includes('>') ||
    lowerCmd.includes('<')
  );
}

// 清理和验证输入
function sanitizeCommand(command: string): string {
  // 移除多余的空格和特殊字符
  return command.trim().replace(/[;&|><`$\\]/g, '');
}

export async function POST(request: Request) {
  try {
    // 获取客户端 IP
    const forwardedFor = headers().get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    
    // 应用速率限制
    const { success } = await rateLimit(ip);
    if (!success) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      );
    }

    // 验证请求体
    const body = await request.json();
    if (!body || typeof body.command !== 'string') {
      return NextResponse.json(
        { error: '无效的请求格式' },
        { status: 400 }
      );
    }

    const command = body.command.trim();

    // 验证命令长度
    if (command.length > 500) {
      return NextResponse.json(
        { error: '命令长度超出限制' },
        { status: 400 }
      );
    }

    // 检查命令安全性
    if (!isCommandSafe(command)) {
      return NextResponse.json(
        { error: '该命令可能存在安全风险，已被禁用' },
        { status: 403 }
      );
    }

    // 清理命令
    const sanitizedCommand = sanitizeCommand(command);

    // 调用 API
    const response = await axios.post(
      API_URL,
      {
        model: 'deepseek_r1',
        messages: [
          {
            role: 'system',
            content: `你现在是一个 Linux 终端模拟器。你的任务是：
1. 直接返回命令的执行结果，不要添加任何解释或额外文字
2. 如果是 ls 命令，返回格式应该是文件和目录的列表，每行一个
3. 如果是 pwd 命令，只返回一个路径
4. 如果是 cat 命令，只返回文件内容
5. 如果是 echo 命令，只返回要显示的文本
6. 如果命令不正确，返回以 "bash: " 开头的错误信息
7. 禁止执行任何危险命令
8. 保持输出简洁，不要添加任何装饰性文字
9. 不要解释命令的作用，只返回执行结果
10. 模拟真实的 Linux 终端输出格式

示例：
用户: ls
助手:
Documents
Downloads
Pictures
Desktop
.bashrc

用户: pwd
助手:
/home/user

用户: echo hello world
助手:
hello world

用户: cat invalid.txt
助手:
cat: invalid.txt: No such file or directory

用户: invalidcmd
助手:
bash: invalidcmd: command not found`
          },
          {
            role: 'user',
            content: sanitizedCommand
          }
        ],
        stream: false,
        max_tokens: 512
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        timeout: 120000 // 增加到 120 秒超时
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // 根据错误类型返回适当的错误信息
    if (error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { error: '请求超时，请稍后重试' },
        { status: 504 }
      );
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || '服务器内部错误';
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 