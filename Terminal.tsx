"use client"

import { useState, useRef, useEffect } from "react"
import { TerminalInput } from "./TerminalInput"
import { TerminalOutput } from "./TerminalOutput"
import { simulateLinuxCommand } from "./lib/api"

// 内置命令列表
const BUILT_IN_COMMANDS = ['help', 'clear', 'sl', 'cmatrix'];

// 危险命令列表
const DANGEROUS_COMMANDS = [
  'rm', 'chmod', 'chown', 'sudo', 'su', 
  'dd', 'mkfs', 'fdisk', 'mount', 'umount', 'systemctl',
  'service', 'kill', 'pkill', ':(){:|:&};:', '> /dev/sda'
];

// 有效的 Linux 命令列表（包括危险命令）
const VALID_COMMANDS = [
  // 文件和目录操作
  'ls', 'll', 'la', 'l', 'pwd', 'cd', 'mkdir', 'touch', 'find',
  'rm', 'mv', 'cp',
  
  // 新增趣味命令
  'cowsay', 'sl', 'fortune', 'cmatrix',
  
  // 文件内容操作
  'cat', 'head', 'tail', 'less', 'more', 'grep', 'wc', 'sort', 'uniq',
  
  // 系统信息
  'date', 'cal', 'uptime', 'whoami', 'who', 'w', 'id',
  'uname', 'hostname', 'domainname', 'dnsdomainname',
  
  // 进程管理
  'ps', 'pstree', 'top', 'htop',
  'kill', 'pkill', // 危险命令
  
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
  'chmod', 'chown', 'sudo', 'su', // 危险命令
  
  // 其他实用工具
  'clear', 'help', 'history', 'alias', 'type', 'which', 'whereis',
  'man', 'info', 'whatis', 'apropos',
  
  // 文件传输
  'scp', 'rsync', 'ftp', 'sftp', 'curl', 'wget',
  
  // 编辑器
  'nano', 'vim', 'vi',

  // 系统管理（危险命令）
  'dd', 'mkfs', 'fdisk', 'mount', 'umount', 'systemctl', 'service'
];

// 检查命令是否为有效的 Linux 命令
function isValidCommand(command: string): boolean {
  // 获取主命令（去掉参数）
  const mainCommand = command.trim().split(' ')[0].toLowerCase();
  return VALID_COMMANDS.includes(mainCommand);
}

// 检查命令是否为危险命令
function isDangerousCommand(command: string): boolean {
  const mainCommand = command.trim().split(' ')[0].toLowerCase();
  return DANGEROUS_COMMANDS.includes(mainCommand);
}

// 检查命令是否为趣味字符命令
function isAsciiArtCommand(command: string): boolean {
  const mainCommand = command.trim().split(' ')[0].toLowerCase();
  return ['cowsay', 'sl', 'fortune'].includes(mainCommand);
}

// 检查输入是否包含中文字符
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

const TRAIN_ASCII = `
      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________/
   |(_)---  |   H\\________/ |   |        =|___ ___/
   /     |  |   H  |  |     |   |         ||_| |
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__
__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ __________|       |__
 |/-=|___|=    ||    ||    ||    |  __  \\   |       |
  \\_/      \\O=====O=====O=====O_/  \\__/  \\____|_______/
`;

// 添加矩阵雨动画状态
export function Terminal() {
  const [history, setHistory] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [trainPosition, setTrainPosition] = useState<number | null>(null)
  const [showMatrix, setShowMatrix] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const trainAnimationRef = useRef<NodeJS.Timeout>()
  const matrixRef = useRef<HTMLCanvasElement>(null)
  const matrixAnimationRef = useRef<number>()

  // 清理动画定时器
  useEffect(() => {
    return () => {
      if (trainAnimationRef.current) {
        clearInterval(trainAnimationRef.current);
      }
      if (matrixAnimationRef.current) {
        cancelAnimationFrame(matrixAnimationRef.current);
      }
    };
  }, []);

  // 矩阵雨动画效果
  useEffect(() => {
    if (!showMatrix || !matrixRef.current) return;

    const canvas = matrixRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 字符集
    const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃ1234567890';
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    // 动画函数
    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      matrixAnimationRef.current = requestAnimationFrame(draw);
    }

    matrixAnimationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (matrixAnimationRef.current) {
        cancelAnimationFrame(matrixAnimationRef.current);
      }
    };
  }, [showMatrix]);

  const focusInput = () => {
    inputRef.current?.focus()
  }

  const handleCommand = async (command: string) => {
    const cmd = command.toLowerCase();
    setHistory((prev) => [...prev, `$ ${command}`])
    
    // 内置命令处理
    if (BUILT_IN_COMMANDS.includes(cmd)) {
      switch (cmd) {
        case "clear":
          setHistory([])
          break
        case "help":
          setHistory((prev) => [...prev, 
            "可用命令:",
            "- help: 显示帮助信息",
            "- clear: 清空终端",
            "- cowsay: 生成 ASCII 字符画，支持多种类型",
            "  示例:",
            "  - cowsay Hello World     # 生成 Tux 企鹅",
            "  - cowsay cat Hello       # 生成猫咪",
            "  - cowsay dog Woof        # 生成狗狗",
            "- sl: 显示一辆动态的小火车",
            "- fortune: 随机生成一首优美的唐诗",
            "- cmatrix: 显示黑客帝国风格的矩阵雨效果",
            "- 其他标准 Linux 命令将通过 AI 模拟执行",
            "注意: 某些危险命令（如 rm、chmod 等）已被禁用"
          ])
          break
        case "sl":
          // 启动火车动画
          setTrainPosition(100) // 从右侧开始
          let position = 100;
          if (trainAnimationRef.current) {
            clearInterval(trainAnimationRef.current);
          }
          trainAnimationRef.current = setInterval(() => {
            position -= 2;
            if (position < -100) {
              clearInterval(trainAnimationRef.current);
              setTrainPosition(null);
              return;
            }
            setTrainPosition(position);
          }, 50);
          break
        case "cmatrix":
          setShowMatrix(true)
          break
      }
      setInputValue("")
      focusInput()
      return;
    }

    // 检查是否是趣味字符命令
    if (isAsciiArtCommand(command.split(' ')[0])) {
      setIsProcessing(true)
      try {
        const response = await simulateLinuxCommand(command.toLowerCase(), true) // 确保命令小写并标记为 ASCII 艺术命令
        const lines = response.split('\n')
        setHistory((prev) => [...prev, ...lines])
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || '未知错误';
        setHistory((prev) => [...prev, `错误: ${errorMessage}`])
      } finally {
        setIsProcessing(false)
        setInputValue("")
        focusInput()
      }
      return;
    }

    // 检查命令有效性
    if (containsChinese(command)) {
      setHistory((prev) => [...prev, "bash: command not found"])
      setInputValue("")
      focusInput()
      return;
    }

    if (!isValidCommand(command)) {
      setHistory((prev) => [...prev, `bash: ${command.split(' ')[0]}: command not found`])
      setInputValue("")
      focusInput()
      return;
    }

    // 检查危险命令
    if (isDangerousCommand(command)) {
      setHistory((prev) => [...prev, "Operation not permitted: 该命令可能造成系统损坏，已被禁用"])
      setInputValue("")
      focusInput()
      return;
    }

    // 外部命令处理
    setIsProcessing(true)

    try {
      const response = await simulateLinuxCommand(command)
      // 将响应按换行符分割成数组
      const lines = response.split('\n')
      setHistory((prev) => [...prev, ...lines])
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '未知错误';
      setHistory((prev) => [...prev, `错误: ${errorMessage}`])
    } finally {
      setIsProcessing(false)
      setInputValue("")
      focusInput()
    }
  }

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [history])

  // 初始聚焦
  useEffect(() => {
    focusInput()
  }, [])

  return (
    <div 
      className="w-full max-w-[95vw] md:max-w-5xl bg-gray-800 rounded-lg shadow-lg overflow-hidden mx-auto my-4 md:my-8 relative min-h-[60vh] md:min-h-[70vh] flex flex-col"
      onClick={focusInput}
    >
      {/* CRT 屏幕效果 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 扫描线效果 */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,_rgba(32,32,32,0.2)_50%,_transparent_100%)] bg-[length:100%_4px] animate-scan"></div>
        {/* 屏幕发光效果 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_rgba(0,0,0,0.1)_100%)]"></div>
        {/* 屏幕弯曲效果 */}
        <div className="absolute inset-0 [box-shadow:inset_0_0_50px_rgba(0,0,0,0.5)]"></div>
      </div>

      {/* 火车动画 */}
      {trainPosition !== null && (
        <div 
          className="absolute inset-0 z-20 pointer-events-none text-green-400 font-mono whitespace-pre"
          style={{ 
            transform: `translateX(${trainPosition}%)`,
            transition: 'transform 50ms linear'
          }}
        >
          {TRAIN_ASCII}
        </div>
      )}

      {/* 矩阵雨动画 */}
      {showMatrix && (
        <div className="absolute inset-0 z-30">
          <canvas
            ref={matrixRef}
            className="w-full h-full"
            onClick={() => {
              setShowMatrix(false);
              if (matrixAnimationRef.current) {
                cancelAnimationFrame(matrixAnimationRef.current);
              }
            }}
          />
        </div>
      )}

      <div className="bg-gray-700 px-2 sm:px-4 py-2 flex items-center justify-between relative z-10">
        <div className="flex items-center">
          <div className="flex space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="ml-2 sm:ml-4 text-white font-mono text-sm sm:text-base">Terminal</div>
        </div>
        {isProcessing && (
          <div className="text-yellow-400 text-sm animate-pulse">
            处理中...
          </div>
        )}
      </div>
      <div className="p-2 sm:p-4 relative z-10 flex-1 flex flex-col min-h-0">
        <TerminalOutput history={history} ref={outputRef} />
        <TerminalInput 
          ref={inputRef}
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          onSubmit={handleCommand}
          disabled={isProcessing} 
        />
      </div>
    </div>
  )
}

