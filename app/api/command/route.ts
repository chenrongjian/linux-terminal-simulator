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
const API_URL = process.env.AI_MODEL_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';
const MODEL_NAME = process.env.AI_MODEL_NAME || 'Qwen/Qwen2.5-Coder-7B-Instruct';
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
  
  // ASCII 艺术字符命令和趣味命令
  'cowsay', 'fortune', 'cmatrix', 'asciiquarium', 'dashboard', 'oneko', 'sl',
  
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

// 检查命令是否为 ASCII 艺术命令
function isAsciiArtCommand(command: string): boolean {
  const mainCommand = command.trim().split(' ')[0].toLowerCase();
  return ['cowsay', 'fortune', 'cal'].includes(mainCommand);
}

// 检查命令是否为动画命令
function isAnimationCommand(command: string): boolean {
  const mainCommand = command.trim().split(' ')[0].toLowerCase();
  return ['sl', 'cmatrix', 'asciiquarium', 'dashboard', 'oneko'].includes(mainCommand);
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

    // 检查是否为动画命令
    if (isAnimationCommand(command)) {
      return NextResponse.json(
        { choices: [{ message: { content: 'Animation command executed' } }] },
        { 
          headers: {
            'Cache-Control': 'no-store, no-cache',
            'X-RateLimit-Remaining': remaining.toString()
          }
        }
      );
    }

    // 检查是否为 ASCII 艺术命令
    if (isAsciiArtCommand(command.split(' ')[0])) {
      // 获取命令类型
      const [cmd, ...args] = command.split(' ');
      
      // 根据不同命令类型设置不同的 prompt
      let systemPrompt = '';
      let promptCommand = command;

      if (cmd === 'fortune') {
        systemPrompt = `你是一个中国古典诗词生成器。每次调用时，随机生成一首优美的唐诗，并遵循以下规则：
1. 只生成唐代诗人的作品
2. 包含诗题、作者和诗句
3. 使用中文输出
4. 格式要求：
   [诗题]
   [作者]
   [诗句]
   
示例：
春望
杜甫
国破山河在，城春草木深。
感时花溅泪，恨别鸟惊心。
烽火连三月，家书抵万金。
白头搔更短，浑欲不胜簪。`;
      } else if (cmd === 'cal') {
        const now = new Date();
        systemPrompt = `You are a calendar ASCII art generator. Generate a cute calendar for the current month with these rules:

1. Show the current month's calendar in a decorative ASCII art frame
2. Highlight today's date
3. Add cute ASCII decorations around the calendar (stars, hearts, flowers, etc.)
4. Include the current year and month at the top
5. Format example:

    ✿ ❀ ❀ Calendar 2024-01 ❀ ❀ ✿
    ╭──────────────────────────╮
    │      January 2024        │
    │                          │
    │   Su Mo Tu We Th Fr Sa   │
    │       1  2  3  4  5  6   │
    │    7  8  9 10 11 12 13   │
    │   14 15 16 17 18 19 20   │
    │   21 22 23 24 25 26 27   │
    │   28 29 30 31            │
    │                          │
    ╰──────────────────────────╯
    ♥ Today is January 5, 2024 ♥

6. Return ONLY the ASCII art calendar, no explanations`;

        promptCommand = `Generate a cute ASCII calendar for ${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')} with today being ${now.getDate()}`;
      } else if (cmd === 'cowsay') {
        // 获取要生成的动物/对象类型和文本
        const [type, ...textParts] = args;
        const text = textParts.join(' ') || 'Meow~';  // 如果没有文本，使用默认文本
        const artType = type?.toLowerCase() || 'tux';  // 如果没有类型，使用默认 tux

        systemPrompt = `You are an ASCII art generator. Generate ASCII art based on the following rules:

1. For different types, generate different ASCII art:
   - For "cat": Generate a cute cat ASCII art like this:
      /\\___/\\
     (  o o  )
     (  =^=  ) 
      (--m--)
   - For "dog": Generate a cute dog ASCII art like this:
      /^___/^
     (  o o  )
      (  w  )  
       |___||
   - For "tux": Generate a Linux penguin (Tux) ASCII art
2. Always put the text in a speech bubble above the ASCII art
3. Make the art cute and recognizable
4. Use simple ASCII characters to ensure compatibility
5. Keep the art within 80 columns
6. Return ONLY the ASCII art with speech bubble, no explanations

Example output for "cat" saying "Hello":
  ________
< Hello! >
  --------
    /\\___/\\
   (  o o  )
   (  =^=  ) 
    (--m--)`;

        promptCommand = `Generate ASCII art of type "${artType}" saying "${text}"`;
      }

      const response = await api.post(API_URL, {
        model: MODEL_NAME,
        stream: false,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: promptCommand
          }
        ],
        max_tokens: MAX_TOKENS,
        temperature: 0.7
      });

      return NextResponse.json(
        { choices: [{ message: { content: response.data.choices[0].message.content } }] },
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
      stream: false,
      messages: [
        {
          role: 'system',
          content: `You are a Linux terminal simulator. Follow these rules strictly:

1. ONLY accept and respond to valid Linux commands in English
2. NEVER respond to questions or conversations
3. NEVER provide explanations or additional text
4. EXACTLY simulate real Linux terminal output format
5. For invalid commands, ONLY return "bash: xxx: command not found"`
        },
        {
          role: 'user',
          content: sanitizedCommand
        }
      ],
      temperature: 0.7,
      max_tokens: MAX_TOKENS,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
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