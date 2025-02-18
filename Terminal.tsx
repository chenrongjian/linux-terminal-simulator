"use client"

import { useState, useRef, useEffect } from "react"
import { TerminalInput } from "./TerminalInput"
import { TerminalOutput } from "./TerminalOutput"
import { simulateLinuxCommand } from "./lib/api"
import CommandPanel from './components/CommandPanel'

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
  const [showNeko, setShowNeko] = useState(false)
  const [nekoPosition, setNekoPosition] = useState({ x: 0, y: 0 })
  const [nekoState, setNekoState] = useState('idle')
  const [showCommandPanel, setShowCommandPanel] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
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
  const terminalRef = useRef<HTMLDivElement>(null)  // 添加终端容器引用

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

    // 获取终端容器元素
    const terminalElement = document.querySelector('.terminal-container');
    if (!terminalElement) return;

    // 初始化猫咪位置到终端中心
    const rect = terminalElement.getBoundingClientRect();
    setNekoPosition({
      x: rect.width / 2 - 32,
      y: rect.height / 2 - 32
    });

    let targetX = rect.width / 2 - 32;
    let targetY = rect.height / 2 - 32;

    // 处理鼠标移动
    const handleMouseMove = (e: MouseEvent) => {
      const terminalRect = terminalElement.getBoundingClientRect();
      targetX = e.clientX - terminalRect.left;
      targetY = e.clientY - terminalRect.top;
    };

    // 动画更新函数
    const updatePosition = () => {
      setNekoPosition(current => {
        const dx = targetX - current.x;
        const dy = targetY - current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
          setNekoState('idle');
          return current;
        }

        setNekoState('running');
        const speed = Math.min(distance * 0.2, 10); // 根据距离动态调整速度，但不超过最大值
        const angle = Math.atan2(dy, dx);
        const newX = current.x + Math.cos(angle) * speed;
        const newY = current.y + Math.sin(angle) * speed;

        // 限制猫咪在终端窗口内
        const terminalRect = terminalElement.getBoundingClientRect();
        const boundedX = Math.min(Math.max(newX, 0), terminalRect.width - 64);
        const boundedY = Math.min(Math.max(newY, 0), terminalRect.height - 64);

        // 更新最后移动时间
        if (boundedX !== current.x || boundedY !== current.y) {
          lastMoveTime.current = Date.now();
        }

        return { x: boundedX, y: boundedY };
      });

      // 检查睡眠状态
      const currentTime = Date.now();
      if (currentTime - lastMoveTime.current > 3000) {
        setNekoState('sleeping');
      }

      nekoAnimationRef.current = requestAnimationFrame(updatePosition);
    };

    // 开始动画循环
    nekoAnimationRef.current = requestAnimationFrame(updatePosition);

    // 添加事件监听器
    window.addEventListener('mousemove', handleMouseMove);

    // 清理事件监听器和动画
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (nekoAnimationRef.current) {
        cancelAnimationFrame(nekoAnimationRef.current);
      }
    };
  }, [showNeko]); // 只在 showNeko 变化时重新设置

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
        setNekoPosition({
          x: rect.width / 2 - 32,
          y: rect.height / 2 - 32
        });
      }
      setShowNeko(prev => !prev)
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
        "help     显示帮助信息",
        "clear    清空终端",
        "cowsay   生成 ASCII 字符画，支持多种类型",
        "fortune  随机生成唐诗",
        "sl       显示动态火车",
        "cmatrix  黑客帝国特效",
        "asciiquarium  水族箱动画",
        "dashboard     系统监控面板",
        "oneko    可爱猫咪动画",
        "cal      精美日历显示",
        "",
        "示例:",
        "cowsay Hello World     # 生成 Tux 企鹅",
        "cowsay cat Hello       # 生成猫咪",
        "cowsay dog Woof       # 生成狗狗"
      ])
      setInputValue("")
      focusInput(true)
      return;
    }

    // 处理动画命令
    if (command === 'sl') {
      setTrainPosition(100)
      let position = 100;
      if (trainAnimationRef.current) {
        clearInterval(trainAnimationRef.current);
      }
      trainAnimationRef.current = setInterval(() => {
        position -= 2;
        if (position < -150) {
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
      
      // 处理命令输出格式
      let formattedOutput = response;
      
      // 如果不是特殊命令（cowsay, fortune, cal），则格式化输出
      if (!isAsciiArtCommand(command.split(' ')[0])) {
        // 移除多余的空白行，但保留 markdown 格式
        formattedOutput = response
          .split('\n')
          .filter(line => line.trim() !== '')
          .join('\n');
      }
      
      const lines = formattedOutput.split('\n');
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

  // 处理命令面板选中的命令
  const handleSelectCommand = (command: string) => {
    setInputValue(command);
    setShowCommandPanel(false);
    focusInput(true);
  };

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMatrix(false)
        setShowAquarium(false)
        setShowDashboard(false)
        setShowCommandPanel(false)
        focusInput(true)
      } else if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowCommandPanel(prev => !prev);
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 处理全屏切换
  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!document.fullscreenElement) {
      try {
        await terminalRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('全屏切换失败:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('退出全屏失败:', err);
      }
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      ref={terminalRef}
      className={`transition-all duration-300 ease-in-out ${
        isFullscreen 
          ? 'fixed inset-0 w-screen h-screen m-0 p-0 rounded-none bg-black'
          : 'w-[92vw] md:w-[800px] h-[92vh] md:h-[600px] rounded-lg bg-gray-800'
      } shadow-lg overflow-hidden relative flex flex-col terminal-container`}
      style={{
        // 在全屏模式下添加额外样式以确保正确的显示方向
        ...(isFullscreen && {
          transform: 'translateZ(0)', // 启用硬件加速
          WebkitTransform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        })
      }}
      onClick={(e) => {
        e.preventDefault();
        focusInput(true);
      }}
    >
      {/* 标题栏 */}
      <div className="h-[40px] flex items-center px-2 relative z-10 bg-gray-700">
        {/* 左侧：终端标题和控制按钮 */}
        <div className="flex items-center">
          <div className="flex space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="ml-2 sm:ml-4 text-white font-mono text-xs sm:text-base">Linux 模拟终端</div>
        </div>

        {/* 中间：命令面板按钮和全屏切换按钮 */}
        <div className="flex items-center space-x-2 ml-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCommandPanel(true);
            }}
            className="text-gray-400 hover:text-white font-mono text-xs sm:text-sm flex items-center space-x-1 transition-colors bg-black/30 px-2 py-0.5 rounded"
          >
            <span className="text-gray-500">$</span>
            <span>命令面板</span>
            <span className="text-xs text-gray-500 hidden sm:inline ml-1">Ctrl+K</span>
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white font-mono text-xs sm:text-sm flex items-center space-x-1 transition-colors bg-black/30 px-2 py-0.5 rounded"
          >
            <span>{isFullscreen ? '退出全屏' : '全屏'}</span>
          </button>
        </div>

        {/* 右侧：处理中状态 */}
        {isProcessing && (
          <div className="text-yellow-400 text-xs sm:text-sm animate-pulse ml-2">
            处理中...
          </div>
        )}
      </div>

      {/* 命令面板组件 */}
      <CommandPanel
        isOpen={showCommandPanel}
        onClose={() => setShowCommandPanel(false)}
        onSelectCommand={handleSelectCommand}
      />

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
            transform: `translate3d(0,0,0)`, // 启用硬件加速
            willChange: 'left, top' // 提示浏览器优化这些属性的变化
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

      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        <div className="flex-1 bg-black text-white font-mono overflow-auto relative min-h-0">
          <div className={`p-2 ${isFullscreen ? 'h-[calc(100vh-80px)]' : ''}`}>
            <TerminalOutput history={history} />
          </div>
        </div>
        <div className="h-[40px] flex items-center px-2 border-t border-gray-800 bg-gray-700">
          <TerminalInput 
            ref={inputRef}
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            onSubmit={handleCommand}
            disabled={isProcessing} 
          />
        </div>
      </div>
    </div>
  )
}

