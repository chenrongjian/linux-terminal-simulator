"use client"

import { useState, useRef, useEffect } from "react"
import { TerminalInput } from "./TerminalInput"
import { TerminalOutput } from "./TerminalOutput"
import { simulateLinuxCommand } from "./lib/api"

// 内置命令列表
const BUILT_IN_COMMANDS = ['help', 'clear', 'sl', 'cmatrix', 'asciiquarium', 'dashboard', 'oneko'];

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
  'cowsay', 'sl', 'fortune', 'cmatrix', 'asciiquarium', 'dashboard',
  
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
  return ['cowsay', 'fortune'].includes(mainCommand);
}

// 检查命令是否为动画命令
function isAnimationCommand(command: string): boolean {
  const mainCommand = command.trim().split(' ')[0].toLowerCase();
  return ['sl', 'cmatrix', 'asciiquarium', 'dashboard', 'oneko'].includes(mainCommand);
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

// ASCII 艺术：鱼
const FISH_RIGHT = [
  "><>",
  "<><",
  "><>",
];

const FISH_LEFT = [
  "<><",
  "><>",
  "<><",
];

const BUBBLE = ["o", "O", "°"];
const SEAWEED = ["|", ")", "("];

// 添加猫咪 ASCII 字符画
const NEKO_IDLE = [
  " /\\___/\\ ",
  "(  o o  )",
  "(  =^=  ) ",
  " (--m--) "
];

const NEKO_RUNNING = [
  " /\\___/\\ ",
  "(  ' '  )",
  "(  =^=  )~",
  " (--m--)  "
];

const NEKO_SLEEPING = [
  " /\\___/\\ ",
  "(  - -  )  z",
  "(  =^=  ) z",
  " (--m--)   "
];

// 添加水族箱动画状态
export function Terminal() {
  const [history, setHistory] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [trainPosition, setTrainPosition] = useState<number | null>(null)
  const [showMatrix, setShowMatrix] = useState(false)
  const [showAquarium, setShowAquarium] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showNeko, setShowNeko] = useState(false)  // 添加猫咪动画状态
  const [nekoPosition, setNekoPosition] = useState({ x: 0, y: 0 })
  const [nekoState, setNekoState] = useState('idle')
  const lastMoveTime = useRef(Date.now())
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const trainAnimationRef = useRef<NodeJS.Timeout>()
  const matrixRef = useRef<HTMLCanvasElement>(null)
  const aquariumRef = useRef<HTMLCanvasElement>(null)
  const dashboardRef = useRef<HTMLCanvasElement>(null)
  const matrixAnimationRef = useRef<number>()
  const aquariumAnimationRef = useRef<number>()
  const dashboardAnimationRef = useRef<number>()
  const nekoAnimationRef = useRef<number>()

  // 清理动画定时器
  useEffect(() => {
    return () => {
      if (trainAnimationRef.current) {
        clearInterval(trainAnimationRef.current);
      }
      if (matrixAnimationRef.current) {
        cancelAnimationFrame(matrixAnimationRef.current);
      }
      if (aquariumAnimationRef.current) {
        cancelAnimationFrame(aquariumAnimationRef.current);
      }
      if (dashboardAnimationRef.current) {
        cancelAnimationFrame(dashboardAnimationRef.current);
      }
    };
  }, []);

  // 矩阵雨动画效果
  useEffect(() => {
    if (!showMatrix || !matrixRef.current) return;

    const canvas = matrixRef.current;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
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

    // 立即开始动画
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (matrixAnimationRef.current) {
        cancelAnimationFrame(matrixAnimationRef.current);
      }
    };
  }, [showMatrix]);

  // 水族箱动画效果
  useEffect(() => {
    if (!showAquarium || !aquariumRef.current) return;

    const canvas = aquariumRef.current;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) return;

    // 设置画布大小
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化海洋生物
    const fishes = Array.from({ length: 5 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height - 100) + 50,
      speed: (Math.random() + 0.5) * 2,
      direction: Math.random() > 0.5 ? 'right' : 'left',
      frame: 0
    }));

    const bubbles = Array.from({ length: 15 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 20,
      speed: Math.random() * 1 + 0.5,
      size: Math.floor(Math.random() * BUBBLE.length)
    }));

    const seaweeds = Array.from({ length: 8 }, () => ({
      x: Math.random() * canvas.width,
      frame: 0
    }));

    // 动画函数
    function draw() {
      ctx.fillStyle = '#001440';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制水草
      ctx.fillStyle = '#0F8';
      seaweeds.forEach(seaweed => {
        const height = canvas.height / 6;
        const y = canvas.height - height;
        for (let i = 0; i < height; i += 20) {
          ctx.font = '20px monospace';
          ctx.fillText(
            SEAWEED[Math.floor(seaweed.frame / 10) % SEAWEED.length],
            seaweed.x,
            y + i
          );
        }
        seaweed.frame++;
      });

      // 绘制鱼
      ctx.fillStyle = '#FF9';
      fishes.forEach(fish => {
        const fishArt = fish.direction === 'right' ? FISH_RIGHT : FISH_LEFT;
        ctx.font = '20px monospace';
        ctx.fillText(
          fishArt[Math.floor(fish.frame / 10) % fishArt.length],
          fish.x,
          fish.y
        );

        fish.x += fish.direction === 'right' ? fish.speed : -fish.speed;
        if (fish.x > canvas.width + 20) {
          fish.direction = 'left';
          fish.x = canvas.width + 10;
        } else if (fish.x < -20) {
          fish.direction = 'right';
          fish.x = -10;
        }
        fish.frame++;
      });

      // 绘制气泡
      ctx.fillStyle = '#8FF';
      bubbles.forEach(bubble => {
        ctx.font = '16px monospace';
        ctx.fillText(BUBBLE[bubble.size], bubble.x, bubble.y);
        bubble.y -= bubble.speed;
        if (bubble.y < -20) {
          bubble.y = canvas.height + Math.random() * 20;
          bubble.x = Math.random() * canvas.width;
        }
      });

      aquariumAnimationRef.current = requestAnimationFrame(draw);
    }

    // 立即开始动画
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (aquariumAnimationRef.current) {
        cancelAnimationFrame(aquariumAnimationRef.current);
      }
    };
  }, [showAquarium]);

  // 仪表盘动画效果
  useEffect(() => {
    if (!showDashboard || !dashboardRef.current) return;

    const canvas = dashboardRef.current;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) return;

    // 设置画布大小
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化数据
    let time = 0;
    const cpuData: number[] = Array(60).fill(0);
    const memoryData: number[] = Array(60).fill(0);
    const networkData: number[] = Array(60).fill(0);
    let activeConnections = 0;
    let totalRequests = 0;
    let securityLevel = 100;

    // 动画函数
    function draw() {
      // 清空画布
      ctx.fillStyle = '#000D1A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制网格背景
      ctx.strokeStyle = '#0F3';
      ctx.lineWidth = 0.3;
      const gridSize = 30;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 更新数据
      time += 0.1;
      cpuData.shift();
      cpuData.push(50 + 30 * Math.sin(time * 0.5) + Math.random() * 20);
      memoryData.shift();
      memoryData.push(60 + 20 * Math.cos(time * 0.3) + Math.random() * 15);
      networkData.shift();
      networkData.push(40 + 35 * Math.sin(time * 0.8) + Math.random() * 25);
      activeConnections = Math.floor(100 + 50 * Math.sin(time * 0.2));
      totalRequests += Math.floor(Math.random() * 10);
      securityLevel = 85 + 10 * Math.sin(time * 0.1);

      // 绘制标题
      ctx.font = '20px monospace';
      ctx.fillStyle = '#0F0';
      ctx.fillText('SYSTEM MONITORING DASHBOARD', 20, 30);
      ctx.fillText('STATUS: ACTIVE', canvas.width - 200, 30);

      // 绘制图表
      const drawChart = (data: number[], y: number, title: string) => {
        ctx.fillStyle = '#0F3';
        ctx.font = '16px monospace';
        ctx.fillText(title, 20, y - 10);

        ctx.beginPath();
        ctx.strokeStyle = '#0F3';
        ctx.lineWidth = 2;
        data.forEach((value, index) => {
          const x = 20 + (index * (canvas.width - 40) / 59);
          const h = value * (80 / 100);
          if (index === 0) {
            ctx.moveTo(x, y + 80 - h);
          } else {
            ctx.lineTo(x, y + 80 - h);
          }
        });
        ctx.stroke();
      };

      // CPU 使用率图表
      drawChart(cpuData, 80, `CPU USAGE: ${cpuData[cpuData.length - 1].toFixed(1)}%`);
      
      // 内存使用率图表
      drawChart(memoryData, 200, `MEMORY USAGE: ${memoryData[memoryData.length - 1].toFixed(1)}%`);
      
      // 网络流量图表
      drawChart(networkData, 320, `NETWORK TRAFFIC: ${networkData[networkData.length - 1].toFixed(1)} MB/s`);

      // 绘制系统信息
      ctx.fillStyle = '#0F3';
      ctx.font = '16px monospace';
      const info = [
        `ACTIVE CONNECTIONS: ${activeConnections}`,
        `TOTAL REQUESTS: ${totalRequests}`,
        `SECURITY LEVEL: ${securityLevel.toFixed(1)}%`,
        `UPTIME: ${Math.floor(time)}s`,
        `SYSTEM STATUS: OPERATIONAL`,
        `THREAT LEVEL: LOW`,
      ];
      info.forEach((text, index) => {
        ctx.fillText(text, canvas.width - 300, 80 + index * 30);
      });

      // 绘制装饰性的十六进制数据流
      ctx.font = '12px monospace';
      ctx.fillStyle = '#0F3';
      for (let i = 0; i < 10; i++) {
        const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
        ctx.fillText(hex, 20 + i * 100, canvas.height - 20);
      }

      dashboardAnimationRef.current = requestAnimationFrame(draw);
    }

    // 立即开始动画
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (dashboardAnimationRef.current) {
        cancelAnimationFrame(dashboardAnimationRef.current);
      }
    };
  }, [showDashboard]);

  // 猫咪动画效果
  useEffect(() => {
    if (!showNeko) return;

    let lastMouseX = 0;
    let lastMouseY = 0;
    let sleepTimeout: NodeJS.Timeout;
    const terminalElement = document.querySelector('.terminal-container');
    if (!terminalElement) return;

    // 处理鼠标移动
    const handleMouseMove = (e: MouseEvent) => {
      // 清除之前的睡眠定时器
      if (sleepTimeout) {
        clearTimeout(sleepTimeout);
      }
      
      // 获取终端窗口的位置和大小
      const terminalRect = terminalElement.getBoundingClientRect();
      
      // 计算鼠标在终端内的相对位置
      const relativeX = e.clientX - terminalRect.left;
      const relativeY = e.clientY - terminalRect.top;
      
      updateNekoPosition(terminalRect, relativeX, relativeY);
      
      // 设置新的睡眠定时器
      sleepTimeout = setTimeout(() => {
        setNekoState('sleeping');
      }, 3000);
    };

    // 处理触摸移动
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // 防止页面滚动
      
      // 清除之前的睡眠定时器
      if (sleepTimeout) {
        clearTimeout(sleepTimeout);
      }
      
      // 获取终端窗口的位置和大小
      const terminalRect = terminalElement.getBoundingClientRect();
      
      // 获取第一个触摸点
      const touch = e.touches[0];
      
      // 计算触摸点在终端内的相对位置
      const relativeX = touch.clientX - terminalRect.left;
      const relativeY = touch.clientY - terminalRect.top;
      
      updateNekoPosition(terminalRect, relativeX, relativeY);
      
      // 设置新的睡眠定时器
      sleepTimeout = setTimeout(() => {
        setNekoState('sleeping');
      }, 3000);
    };

    // 更新猫咪位置的通用函数
    const updateNekoPosition = (terminalRect: DOMRect, x: number, y: number) => {
      // 限制位置在终端窗口内
      const mouseX = Math.min(Math.max(x, 32), terminalRect.width - 32);
      const mouseY = Math.min(Math.max(y, 32), terminalRect.height - 32);
      
      // 计算与猫咪的距离
      const dx = mouseX - nekoPosition.x;
      const dy = mouseY - nekoPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 如果距离太近，不需要移动
      if (distance < 5) {
        setNekoState('idle');
        return;
      }

      // 更新猫咪位置和状态
      const speed = 5;
      const angle = Math.atan2(dy, dx);
      const newX = Math.min(Math.max(
        nekoPosition.x + Math.cos(angle) * speed,
        32
      ), terminalRect.width - 32);
      const newY = Math.min(Math.max(
        nekoPosition.y + Math.sin(angle) * speed,
        32
      ), terminalRect.height - 32);
      
      setNekoPosition({ x: newX, y: newY });
      setNekoState('running');
    };

    // 添加事件监听器
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    // 初始化睡眠定时器
    sleepTimeout = setTimeout(() => {
      setNekoState('sleeping');
    }, 3000);

    // 清理事件监听器和定时器
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (sleepTimeout) {
        clearTimeout(sleepTimeout);
      }
    };
  }, [showNeko, nekoPosition]);

  const focusInput = (closeAnimations: boolean = true) => {
    inputRef.current?.focus()
    // 只在需要时关闭动画效果
    if (closeAnimations) {
      setShowMatrix(false)
      setShowAquarium(false)
      setShowDashboard(false)
    }
  }

  const handleCommand = async (command: string) => {
    // 如果输入为空，直接返回
    if (!command.trim()) {
      return;
    }

    // 记录命令历史
    setHistory((prev) => [...prev, `$ ${command}`])

    // 处理特殊命令
    if (command === 'clear') {
      setHistory([])
      setInputValue("")
      focusInput(true)
      return;
    }

    if (command === 'oneko') {
      const terminalElement = document.querySelector('.terminal-container');
      if (terminalElement) {
        const rect = terminalElement.getBoundingClientRect();
        // 设置猫咪在终端中央
        setNekoPosition({
          x: rect.width / 2 - 32,  // 32 是猫咪宽度的一半
          y: rect.height / 2 - 32  // 32 是猫咪高度的一半
        });
      }
      setShowNeko(prev => !prev)  // 切换猫咪显示状态
      setInputValue("")
      focusInput(true)
      return;
    }

    // 检查命令有效性
    if (containsChinese(command)) {
      setHistory((prev) => [...prev, "bash: command not found"])
      setInputValue("")
      focusInput(true)
      return;
    }

    if (!isValidCommand(command)) {
      setHistory((prev) => [...prev, `bash: ${command.split(' ')[0]}: command not found`])
      setInputValue("")
      focusInput(true)
      return;
    }

    // 检查危险命令
    if (isDangerousCommand(command)) {
      setHistory((prev) => [...prev, "Operation not permitted: 该命令可能造成系统损坏，已被禁用"])
      setInputValue("")
      focusInput(true)
      return;
    }

    // 处理 help 命令
    if (command === 'help') {
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
        "- asciiquarium: 显示水族箱动画效果",
        "- dashboard: 显示系统监控仪表盘",
        "- oneko: 切换猫咪动画的显示状态",
        "- cal: 显示精美的当月日历，带有可爱装饰",
        "- 其他标准 Linux 命令将通过 AI 模拟执行",
        "注意: 某些危险命令（如 rm、chmod 等）已被禁用"
      ])
      setInputValue("")
      focusInput(true)
      return;
    }

    // 处理动画命令
    if (command === 'sl') {
      // 启动火车动画
      setTrainPosition(100) // 从右侧开始
      let position = 100;
      if (trainAnimationRef.current) {
        clearInterval(trainAnimationRef.current);
      }
      trainAnimationRef.current = setInterval(() => {
        position -= 2;
        if (position < -150) { // 调整为 -150 确保火车完全离开屏幕
          clearInterval(trainAnimationRef.current);
          setTrainPosition(null);
          return;
        }
        setTrainPosition(position);
      }, 50);
      setInputValue("")
      focusInput(false)
      return;
    }

    if (command === 'cmatrix') {
      setShowMatrix(true)
      setInputValue("")
      focusInput(false)
      return;
    }

    if (command === 'asciiquarium') {
      setShowAquarium(true)
      setInputValue("")
      focusInput(false)
      return;
    }

    if (command === 'dashboard') {
      setShowDashboard(true)
      setInputValue("")
      focusInput(false)
      return;
    }

    // 外部命令处理
    setIsProcessing(true)

    try {
      const response = await simulateLinuxCommand(command)
      const lines = response.split('\n')
      setHistory((prev) => [...prev, ...lines])
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '未知错误';
      setHistory((prev) => [...prev, `错误: ${errorMessage}`])
    } finally {
      setIsProcessing(false)
      setInputValue("")
      focusInput(true)
    }
  }

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [history])

  // 初始聚焦
  useEffect(() => {
    focusInput(true)
  }, [])

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMatrix(false)
        setShowAquarium(false)
        setShowDashboard(false)
        focusInput(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div 
      className="w-full max-w-[95vw] md:max-w-5xl bg-gray-800 rounded-lg shadow-lg overflow-hidden mx-auto my-4 md:my-8 relative min-h-[60vh] md:min-h-[70vh] flex flex-col terminal-container"
      onClick={(e) => {
        e.preventDefault();
        focusInput(true);
      }}
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
          className="absolute inset-0 z-20 pointer-events-none text-green-400 font-mono whitespace-pre flex items-center"
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
        <div className="absolute inset-0 z-30 bg-black">
          <canvas
            ref={matrixRef}
            className="w-full h-full cursor-pointer"
            style={{ background: 'black' }}
            onClick={() => {
              setShowMatrix(false);
              if (matrixAnimationRef.current) {
                cancelAnimationFrame(matrixAnimationRef.current);
              }
            }}
          />
        </div>
      )}

      {/* 水族箱动画 */}
      {showAquarium && (
        <div className="absolute inset-0 z-30 bg-[#001440]">
          <canvas
            ref={aquariumRef}
            className="w-full h-full cursor-pointer"
            style={{ background: '#001440' }}
            onClick={() => {
              setShowAquarium(false);
              if (aquariumAnimationRef.current) {
                cancelAnimationFrame(aquariumAnimationRef.current);
              }
            }}
          />
        </div>
      )}

      {/* 仪表盘动画 */}
      {showDashboard && (
        <div className="absolute inset-0 z-30 bg-[#000D1A]">
          <canvas
            ref={dashboardRef}
            className="w-full h-full cursor-pointer"
            style={{ background: '#000D1A' }}
            onClick={() => {
              setShowDashboard(false);
              if (dashboardAnimationRef.current) {
                cancelAnimationFrame(dashboardAnimationRef.current);
              }
            }}
          />
        </div>
      )}

      {/* 添加猫咪动画 */}
      {showNeko && (
        <div 
          className="absolute z-50 pointer-events-none select-none font-mono whitespace-pre text-yellow-300"
          style={{ 
            left: `${nekoPosition.x}px`,
            top: `${nekoPosition.y}px`,
            transition: 'all 0.1s linear'
          }}
        >
          {nekoState === 'sleeping' && NEKO_SLEEPING.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          {nekoState === 'running' && NEKO_RUNNING.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          {nekoState === 'idle' && NEKO_IDLE.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
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
        <div 
          className="flex-1 bg-black text-white font-mono p-4 overflow-auto relative" 
          onClick={(e) => {
            e.preventDefault();
            focusInput(true);
          }}
          ref={outputRef}
        >
          <TerminalOutput history={history} />
        </div>
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

