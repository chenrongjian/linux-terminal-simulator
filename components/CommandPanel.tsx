import { useState } from 'react';

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
      { name: 'date', description: '显示系统日期和时间' },
      { name: 'cal', description: '显示日历', example: 'cal 2024' },
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

  // 搜索过滤逻辑
  const filteredCommands = searchTerm
    ? commandCategories.flatMap(category => 
        category.commands.filter(cmd => 
          cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cmd.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : commandCategories.find(c => c.name === selectedCategory)?.commands || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-xl flex flex-col">
        {/* 面板头部 */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl text-white font-semibold">命令快捷面板</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            placeholder="搜索命令..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-1 min-h-0">
          {/* 分类侧边栏 */}
          <div className="w-48 border-r border-gray-700 overflow-y-auto">
            {commandCategories.map(category => (
              <button
                key={category.name}
                onClick={() => {
                  setSelectedCategory(category.name);
                  setSearchTerm('');
                }}
                className={`w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-gray-700 ${
                  selectedCategory === category.name && !searchTerm ? 'bg-gray-700' : ''
                }`}
              >
                <span>{category.icon}</span>
                <span className="text-white">{category.name}</span>
              </button>
            ))}
          </div>

          {/* 命令列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-4">
              {filteredCommands.map(command => (
                <div
                  key={command.name}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer"
                  onClick={() => onSelectCommand(command.name)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg text-white font-mono">{command.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCommand(command.name);
                      }}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      使用
                    </button>
                  </div>
                  <p className="text-gray-300 mt-2">{command.description}</p>
                  {command.example && (
                    <p className="text-gray-400 mt-2 font-mono text-sm">
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