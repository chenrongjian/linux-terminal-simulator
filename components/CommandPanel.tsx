import { useState, useMemo, useRef, useEffect } from 'react';

// 定义命令分类和命令数据结构
interface Command {
  name: string;
  description: string;
  example?: string;
}

interface CommandCategory {
  name: string;
  icon: string;
  commands: Command[];
}

// 预定义的命令分类数据
const commandCategories: CommandCategory[] = [
  {
    name: '文件操作',
    icon: '📁',
    commands: [
      { name: 'ls', description: '列出目录内容', example: 'ls -l' },
      { name: 'pwd', description: '显示当前工作目录' },
      { name: 'cd', description: '切换目录', example: 'cd /path/to/dir' },
      { name: 'mkdir', description: '创建新目录', example: 'mkdir new_dir' },
      { name: 'touch', description: '创建新文件', example: 'touch file.txt' },
    ]
  },
  {
    name: '文本处理',
    icon: '📝',
    commands: [
      { name: 'cat', description: '查看文件内容', example: 'cat file.txt' },
      { name: 'grep', description: '搜索文本内容', example: 'grep "text" file' },
      { name: 'echo', description: '输出文本', example: 'echo "Hello"' },
      { name: 'head', description: '查看文件开头', example: 'head -n 10 file' },
      { name: 'tail', description: '查看文件结尾', example: 'tail -f log' },
    ]
  },
  {
    name: '系统信息',
    icon: '🖥️',
    commands: [
      { name: 'help', description: '显示帮助信息和可用命令列表' },
      { name: 'clear', description: '清空终端屏幕' },
      { name: 'date', description: '显示系统日期和时间' },
      { name: 'uptime', description: '显示系统运行时间' },
      { name: 'whoami', description: '显示当前用户名' },
      { name: 'df', description: '显示磁盘使用情况', example: 'df -h' },
    ]
  },
  {
    name: '趣味命令',
    icon: '🎮',
    commands: [
      { name: 'cowsay', description: '生成动物字符画', example: 'cowsay Hello' },
      { name: 'fortune', description: '随机生成唐诗' },
      { name: 'cal', description: '显示精美日历' },
    ]
  },
  {
    name: '动画效果',
    icon: '🎬',
    commands: [
      { name: 'sl', description: '火车动画效果' },
      { name: 'cmatrix', description: '黑客帝国特效' },
      { name: 'asciiquarium', description: '水族箱动画' },
      { name: 'oneko', description: '猫咪动画' },
      { name: 'dashboard', description: '系统监控面板' },
    ]
  }
];

interface CommandPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (command: string) => void;
}

export default function CommandPanel({ isOpen, onClose, onSelectCommand }: CommandPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(commandCategories[0].name);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // 初始化面板位置到右上角
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      
      // 计算初始位置，确保面板完全可见
      // 水平方向：距离右边界 40px
      // 垂直方向：距离顶部 40px
      const maxX = window.innerWidth - rect.width;
      const x = maxX - 40;
      const y = 40;
      
      setPosition({ x, y });
    }
  }, [isOpen]);

  // 处理拖动开始
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: position.x,
      initialY: position.y
    };
    setIsDragging(true);
  };

  // 处理拖动
  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !panelRef.current) return;

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;

    // 计算新位置
    let newX = dragRef.current.initialX + deltaX;
    let newY = dragRef.current.initialY + deltaY;

    const rect = panelRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    // 限制面板不超出屏幕边界
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setPosition({ x: newX, y: newY });
  };

  // 处理拖动结束
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  // 搜索过滤逻辑
  const filteredCommands = useMemo(() => {
    if (searchTerm) {
      // 搜索模式：在所有分类中搜索
      return commandCategories.flatMap(category => 
        category.commands.filter(cmd => 
          cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      // 分类模式：显示选中分类的命令
      const category = commandCategories.find(c => c.name === selectedCategory);
      return category ? category.commands : [];
    }
  }, [searchTerm, selectedCategory]);

  // 处理分类切换
  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSearchTerm('');
  };

  // 处理搜索输入
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value) {
      setSelectedCategory('');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        ref={panelRef}
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transition: isDragging ? 'none' : 'all 0.2s',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col border border-gray-700/50 relative"
        onClick={(e) => e.stopPropagation()}
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

        {/* 面板头部 - 添加拖动手柄 */}
        <div 
          className="bg-gray-700 p-4 border-b border-gray-700/50 flex justify-between items-center relative z-10 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1 sm:space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
            </div>
            <h2 className="text-white font-mono text-sm sm:text-base">命令快捷面板</h2>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b border-gray-700/50 relative z-10 bg-black/20" onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              placeholder="搜索命令..."
              value={searchTerm}
              onChange={handleSearch}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full pl-8 pr-4 py-2 bg-gray-800/50 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500/50 font-mono placeholder-gray-600"
              autoFocus
            />
          </div>
        </div>

        <div className="flex flex-1 min-h-0 relative z-10 bg-black/20" onClick={(e) => e.stopPropagation()}>
          {/* 分类侧边栏 */}
          <div className="w-48 border-r border-gray-700/50 overflow-y-auto bg-gray-800/30">
            {commandCategories.map(category => (
              <button
                key={category.name}
                onClick={() => handleCategoryClick(category.name)}
                className={`w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-gray-700/50 transition-colors ${
                  selectedCategory === category.name && !searchTerm ? 'bg-gray-700/80 text-white' : 'text-gray-300'
                }`}
              >
                <span>{category.icon}</span>
                <span className="font-mono">{category.name}</span>
              </button>
            ))}
          </div>

          {/* 命令列表 */}
          <div className="flex-1 overflow-y-auto p-4 bg-black/20">
            <div className="grid grid-cols-1 gap-4">
              {filteredCommands.map(command => (
                <div
                  key={command.name}
                  className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-700/80 cursor-pointer border border-gray-700/30 transition-all hover:border-gray-400/30 group"
                  onClick={() => onSelectCommand(command.name)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg text-white font-mono group-hover:text-gray-200">{command.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCommand(command.name);
                      }}
                      className="px-3 py-1 bg-gray-700/50 text-white rounded hover:bg-gray-600/50 text-sm font-mono transition-colors"
                    >
                      使用
                    </button>
                  </div>
                  <p className="text-gray-400 mt-2 font-mono text-sm">{command.description}</p>
                  {command.example && (
                    <p className="text-gray-500 mt-2 font-mono text-sm">
                      示例: {command.example}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 