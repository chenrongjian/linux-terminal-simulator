import { NextResponse } from 'next/server';
import axios from 'axios';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

// Route Segment Config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 从环境变量获取配置
const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = process.env.AI_MODEL_API_URL || 'https://cloud.luchentech.com/api/maas/chat/completions';
const MODEL_NAME = process.env.AI_MODEL_NAME || 'deepseek_r1';
const MAX_TOKENS = parseInt(process.env.AI_MODEL_MAX_TOKENS || '512', 10);

// 验证必要的环境变量
if (!API_KEY) {
  console.error('Missing required environment variable: DEEPSEEK_API_KEY');
}

// 创建一个带有默认配置的 axios 实例
const api = axios.create({
  timeout: 180000, // 增加到 180 秒超时
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
});

// 危险命令列表
const DANGEROUS_COMMANDS = [
  'rm', 'chmod', 'chown', 'sudo', 'su', 
  'dd', 'mkfs', 'fdisk', 'mount', 'umount', 'systemctl',
  'service', 'kill', 'pkill', ':(){:|:&};:', '> /dev/sda'
];

// 基本命令列表
const VALID_COMMANDS = [
  // 文件和目录操作
  'ls', 'll', 'la', 'l', 'pwd', 'cd', 'mkdir', 'touch', 'find',
  'cp', 'mv',
  
  // 文件内容操作
  'cat', 'head', 'tail', 'less', 'more', 'grep', 'wc', 'sort', 'uniq',
  
  // 系统信息
  'date', 'cal', 'uptime', 'whoami', 'who', 'w', 'id',
  'uname', 'hostname', 'domainname', 'dnsdomainname',
  
  // 进程管理
  'ps', 'pstree', 'top', 'htop',
  
  // 系统资源
  'free', 'df', 'du', 'iostat', 'vmstat',
  
  // 网络相关
  'ping', 'netstat', 'ss', 'ip', 'ifconfig', 'host', 'dig', 'nslookup',
  
  // 文本处理
  'echo', 'printf', 'sed', 'awk', 'cut', 'tr', 'diff', 'cmp',
  
  // 压缩和解压
  'tar', 'gzip', 'gunzip', 'zip', 'unzip', 'bzip2', 'bunzip2',
  
  // 用户和权限
  'groups', 'users', 'last', 'finger',
  
  // 其他实用工具
  'clear', 'help', 'history', 'alias', 'type', 'which', 'whereis',
  'man', 'info', 'whatis', 'apropos',
  
  // 文件传输
  'scp', 'rsync', 'ftp', 'sftp', 'curl', 'wget',
  
  // 编辑器
  'nano', 'vim', 'vi'
];

// 检查命令是否为有效的 Linux 命令
function isValidCommand(command: string): boolean {
  const cmd = command.trim().split(' ')[0].toLowerCase();
  return VALID_COMMANDS.includes(cmd);
}

// 检查命令是否为危险命令
function isDangerousCommand(command: string): boolean {
  const mainCommand = command.trim().split(' ')[0].toLowerCase();
  return DANGEROUS_COMMANDS.includes(mainCommand);
}

// 清理和验证输入
function sanitizeCommand(command: string): string {
  // 检查是否包含中文字符
  if (/[\u4e00-\u9fa5]/.test(command)) {
    return 'invalid_command';
  }
  
  // 检查是否为有效命令
  if (!isValidCommand(command)) {
    return 'invalid_command';
  }
  
  // 只移除危险的 shell 特殊字符，保留所有其他字符
  return command.trim().replace(/[`]|\$|\$\(|\||>|</g, '');
}

export async function POST(request: Request) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API 密钥未配置' },
        { status: 500 }
      );
    }

    // 获取客户端 IP
    const forwardedFor = headers().get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    
    // 应用速率限制
    const { success, remaining } = await rateLimit(ip);
    if (!success) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
            'Retry-After': '60'
          }
        }
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

    // 检查是否包含中文字符
    if (/[\u4e00-\u9fa5]/.test(command)) {
      return NextResponse.json(
        { choices: [{ message: { content: 'bash: command not found' } }] },
        { 
          headers: {
            'Cache-Control': 'no-store, no-cache',
            'X-RateLimit-Remaining': remaining.toString()
          }
        }
      );
    }

    // 检查是否为有效命令
    if (!isValidCommand(command)) {
      return NextResponse.json(
        { choices: [{ message: { content: `bash: ${command.split(' ')[0]}: command not found` } }] },
        { 
          headers: {
            'Cache-Control': 'no-store, no-cache',
            'X-RateLimit-Remaining': remaining.toString()
          }
        }
      );
    }

    // 检查是否为危险命令
    if (isDangerousCommand(command)) {
      return NextResponse.json(
        { choices: [{ message: { content: 'Operation not permitted' } }] },
        { 
          headers: {
            'Cache-Control': 'no-store, no-cache',
            'X-RateLimit-Remaining': remaining.toString()
          }
        }
      );
    }

    // 清理命令，只移除真正危险的字符
    const sanitizedCommand = command.trim().replace(/[`]|\$|\$\(|\||>|</g, '');

    // 调用 API
    const response = await api.post(API_URL, {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: `You are a Linux terminal simulator. Follow these rules strictly:

1. ONLY accept and respond to valid Linux commands in English
2. NEVER respond to questions or conversations
3. NEVER provide explanations or additional text
4. EXACTLY simulate real Linux terminal output format
5. For invalid commands, ONLY return "bash: xxx: command not found"

Command output format examples:

$ ls
Documents
Downloads
Pictures
Desktop
.bashrc

$ ll
drwxr-xr-x 2 user user 4096 Feb 11 10:30 Documents
drwxr-xr-x 2 user user 4096 Feb 11 10:30 Downloads
drwxr-xr-x 2 user user 4096 Feb 11 10:30 Pictures
drwxr-xr-x 2 user user 4096 Feb 11 10:30 Desktop
-rw-r--r-- 1 user user  220 Feb 11 10:30 .bashrc

$ pwd
/home/user

$ echo hello
hello

$ cat file.txt
cat: file.txt: No such file or directory

$ cp file1 file2
cp: cannot stat 'file1': No such file or directory

$ xyz
bash: xyz: command not found

Supported command aliases:
ll = ls -l
la = ls -la
l = ls -lah`
        },
        {
          role: 'user',
          content: sanitizedCommand
        }
      ],
      stream: false,
      max_tokens: MAX_TOKENS
    });

    return NextResponse.json(response.data, {
      headers: {
        'Cache-Control': 'no-store, no-cache',
        'X-RateLimit-Remaining': remaining.toString()
      }
    });
  } catch (error: any) {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { error: '请求超时，请稍后重试' },
        { status: 504 }
      );
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || '服务器内部错误';
      return NextResponse.json(
        { error: message },
        { status }
      );
    }

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 