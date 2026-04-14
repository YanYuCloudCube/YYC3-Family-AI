import {
  Calculator,
  CheckSquare,
  CloudSun,
  Timer,
  StickyNote,
  Flame,
  TrendingUp,
  ArrowLeftRight,
} from "lucide-react";
import type { TemplateWithPreview } from "./TemplatePreviewModal";

export const APP_TEMPLATES: TemplateWithPreview[] = [
  {
    id: "app-calc",
    name: "智能计算器",
    description: "现代风格计算器，支持基础运算、科学计算、历史记录、键盘快捷键",
    category: "utility",
    tags: ["React", "Hooks", "CSS Grid"],
    stars: 412,
    downloads: 2340,
    gradient: "from-slate-500 to-zinc-600",
    icon: Calculator,
    panels: 1,
    techStack: ["React 18", "TypeScript", "CSS Grid"],
    difficulty: "beginner",
    estimatedTime: "5分钟",
    features: [
      "基础四则运算 + 百分号 / 正负切换",
      "科学模式：三角函数 / 幂运算 / 根号",
      "计算历史记录（最近 20 条）",
      "键盘快捷键支持（数字键 + 运算符）",
      "响应式布局适配桌面和移动端",
      "暗色主题 + 按键动效反馈",
    ],
    previewCode: {
      react: `import { useState, useCallback } from "react";

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<string | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const calc = useCallback((a: number, b: number, o: string) => {
    switch(o) { case "+": return a+b; case "-": return a-b;
      case "*": return a*b; case "/": return b!==0 ? a/b : "Error"; }
    return b;
  }, []);

  const handleNum = (n: string) => {
    if (resetNext || display === "0") { setDisplay(n); setResetNext(false); }
    else { if(display.length < 12) setDisplay(display + n); }
  };

  const handleOp = (o: string) => {
    const curr = parseFloat(display);
    if (prev !== null && op && !resetNext) {
      const result = calc(prev, curr, op);
      setDisplay(String(result));
      setPrev(result as number);
    } else { setPrev(curr); }
    setOp(o); setResetNext(true);
  };

  const handleEq = () => {
    if (prev === null || !op) return;
    const curr = parseFloat(display);
    const result = calc(prev, curr, op);
    const expr = \`\${prev} \${op} \${curr} = \${result}\`;
    setHistory(h => [expr, ...h].slice(0, 10));
    setDisplay(String(result));
    setPrev(null); setOp(null); setResetNext(true);
  };

  const handleClear = () => { setDisplay("0"); setPrev(null); setOp(null); setResetNext(false); };

  const btnCls = (type="normal") => \`w-full h-12 rounded-lg font-semibold text-base transition-all active:scale-95 flex items-center justify-center cursor-pointer \${
    type==="op" ? "bg-blue-500/80 text-white hover:bg-blue-400" :
    type==="eq" ? "bg-emerald-500 text-white hover:bg-emerald-400 col-span-2" :
    type==="fn" ? "bg-zinc-600 text-zinc-200 hover:bg-zinc-500" :
    "bg-zinc-700 text-zinc-100 hover:bg-zinc-600"
  }\`;

  return (
    <div style={{ padding: 16, background: "#18181b", color: "#e4e4e7", fontFamily: "system-ui", minHeight: "100%", maxWidth: 360, margin: "0 auto" }}>
      <div style={{ background: "#27272a", borderRadius: 16, padding: 16 }}>
        {/* Display */}
        <div style={{ textAlign: "right", padding: "16px 8px", marginBottom: 8, minHeight: 56 }}>
          {op && prev !== null && (
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>{prev} {op}</div>
          )}
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>{display}</div>
        </div>
        {/* Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {[{l:"C",f:handleClear,t:"fn"},{l:"±",f:()=>{setDisplay(String(-parseFloat(display)));setResetNext(true)},t:"fn"},
            {l:"%",f:()=>{setDisplay(String(parseFloat(display)/100));setResetNext(true)},t:"fn"},
            {l:"÷",f:()=>handleOp("/"),t:"op"},
            {l:"7",f:()=>handleNum("7")},{l:"8",f:()=>handleNum("8")},{l:"9",f:()=>handleNum("9")},
            {l:"×",f:()=>handleOp("*"),t:"op"},
            {l:"4",f:()=>handleNum("4")},{l:"5",f:()=>handleNum("5")},{l:"6",f:()=>handleNum("6")},
            {l:"-",f:()=>handleOp("-"),t:"op"},
            {l:"1",f:()=>handleNum("1")},{l:"2",f:()=>handleNum("2")},{l:"3",f:()=>handleNum("3")},
            {l:"+",f:()=>handleOp("+"),t:"op"},
            {l:"0",f:()=>handleNum("0"),s:"col-span-2"},{l:".",f:()=>{
              if(!display.includes(".")) setDisplay(display+".");
            }},
            {l:"=",f:handleEq,t:"eq"}
          ].map((b,i)=>(
            <button key={i} onClick={b.f}
              className={btnCls(b.t)}
              style={b.s?{gridColumn:"span 2"}:{}}>
              {b.l}
            </button>
          ))}
        </div>
        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: 12, borderTop: "1px solid #3f3f46", paddingTop: 8 }}>
            <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>历史</div>
            {history.slice(0,3).map((h,i)=><div key={i} style={{fontSize:11,color:"#a1a1aa"}}>{h}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}`,
      dependencies: {},
    },
  },
  {
    id: "app-todo",
    name: "待办事项清单",
    description: "功能完善的 Todo 应用，支持分类标签、优先级、筛选搜索、拖拽排序、本地持久化",
    category: "productivity",
    tags: ["React", "Zustand", "LocalStorage"],
    stars: 389,
    downloads: 2100,
    gradient: "from-emerald-500 to-green-600",
    icon: CheckSquare,
    panels: 2,
    techStack: ["React 18", "TypeScript", "Zustand", "LocalStorage"],
    difficulty: "beginner",
    estimatedTime: "8分钟",
    features: [
      "添加 / 编辑 / 删除待办项",
      "优先级标记（高/中/低）+ 颜色区分",
      "完成状态切换 + 划线效果",
      "按状态筛选（全部/待办/已完成）",
      "关键词搜索过滤",
      "本地存储自动保存",
    ],
    previewCode: {
      react: `import { useState, useMemo } from "react";

interface Todo { id: number; text: string; done: boolean; priority: "high" | "medium" | "low"; }

const initialTodos: Todo[] = [
  { id: 1, text: "学习 React Hooks 原理", done: true, priority: "high" },
  { id: 2, text: "完成项目文档编写", done: false, priority: "medium" },
  { id: 3, text: "代码审查与重构优化", done: false, priority: "high" },
  { id: 4, text: "准备周会演示材料", done: false, priority: "low" },
  { id: 5, text: "部署测试环境", done: true, priority: "medium" },
];

const pColors = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const pLabels = { high: "高", medium: "中", low: "低" };

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  const filtered = useMemo(() => {
    let list = todos;
    if (filter === "active") list = list.filter(t => !t.done);
    else if (filter === "done") list = list.filter(t => t.done);
    return list;
  }, [todos, filter]);

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input.trim(), done: false, priority }]);
    setInput("");
  };

  const toggle = (id: number) => setTodos(todos.map(t => t.id === id ? {...t, done: !t.done} : t));
  const remove = (id: number) => setTodos(todos.filter(t => t.id !== id));

  const doneCount = todos.filter(t => t.done).length;

  return (
    <div style={{ padding: 20, background: "#0c0a09", color: "#e7e5e4", fontFamily: "system-ui", minHeight: "100%", maxWidth: 420, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>📋 待办清单</h1>
          <span style={{ fontSize: 13, color: "#78716c" }}>{doneCount}/{todos.length} 已完成</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, borderRadius: 2, background: "#292524" }}>
          <div style={{
            width: todos.length ? \`\${(doneCount/todos.length)*100}%\` : "0%",
            height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#22c55e,#10b981)",
            transition: "width 0.3s"
          }} />
        </div>
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&addTodo()}
          placeholder="添加新任务..."
          style={{ flex:1,padding:"10px 14px",borderRadius:10,border:"1px solid #44403c",
            background:"#1c1917",color:"#e7e5e4",fontSize:14,outline:"none" }} />
        <select value={priority} onChange={e=>setPriority(e.target.value as any)}
          style={{padding:"0 10px",borderRadius:10,border:"1px solid #44403c",background:"#1c1917",color:"#e7e5e4",cursor:"pointer" }}>
          <option value="high">🔴 高</option><option value="medium">🟡 中</option><option value="low">🟢 低</option>
        </select>
        <button onClick={addTodo} style={{padding:"10px 18px",borderRadius:10,border:"none",background:"#22c55e",color:"white",fontWeight:600,cursor:"pointer",fontSize:13}}>+</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["all","active","done"] as const).map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:"6px 14px",borderRadius:8,border:"none",cursor:pointer,fontSize:12,fontWeight:500,
            background: filter===f?"#22c55e20":"#292524",color: filter===f?"#22c55e":"#a8a29e"
          }}>{f==="all"?\`全部 (\${todos.length})\`:f==="active"?\`待办 (\${todos.length-doneCount})\`:f==="done"?\`已完成 (\${doneCount})\`:f}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 32, color: "#78716c" }}>✨ 暂无任务</div>
        )}
        {filtered.map(todo => (
          <div key={todo.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
            borderRadius: 12, background: todo.done ? "#1c191750" : "#1c1917",
            borderLeft: \`3px solid \${pColors[todo.priority]}\`, transition: "all 0.2s"
          }}>
            <button onClick={() => toggle(todo.id)} style={{
              width: 22, height: 22, borderRadius: "50%", border: \`2px solid \${pColors[todo.priority]}\`,
              background: todo.done ? pColors[todo.priority] : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              color: "white", fontSize: 12, flexShrink: 0
            }}>{todo.done ? "✓" : ""}</button>
            <span style={{ flex: 1, fontSize: 14, textDecoration: todo.done ? "line-through" : "none", opacity: todo.done ? 0.5 : 1 }}>
              {todo.text}
            </span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: \`\${pColors[todo.priority]}20\`, color: pColors[todo.priority] }}>
              {pLabels[todo.priority]}
            </span>
            <button onClick={() => remove(todo.id)} style={{ color: "#78716c", cursor: "pointer", fontSize: 16, border: "none", background: "transparent" }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}`,
      dependencies: {},
    },
  },
  {
    id: "app-timer",
    name: "番茄钟计时器",
    description: "专注效率工具，25分钟工作+5分钟休息循环，支持自定义时长、统计报告、音效提醒",
    category: "productivity",
    tags: ["React", "Hooks", "Audio API"],
    stars: 356,
    downloads: 1890,
    gradient: "from-red-500 to-orange-600",
    icon: Flame,
    panels: 1,
    techStack: ["React 18", "TypeScript", "Web Audio API"],
    difficulty: "beginner",
    estimatedTime: "6分钟",
    features: [
      "番茄工作法：25min 工作 / 5min 短休息 / 15min 长休息",
      "圆形进度动画（SVG）",
      "开始 / 暂停 / 重置控制",
      "今日完成番茄数统计",
      "自定义工作/休息时长",
      "浏览器通知提醒",
    ],
    previewCode: {
      react: `import { useState, useEffect, useRef, useCallback } from "react";

type Mode = "work" | "shortBreak" | "longBreak";

const MODE_CONFIG: Record<Mode, { label: string; duration: number; color: string }> = {
  work: { label: "专注中", duration: 25 * 60, color: "#ef4444" },
  shortBreak: { label: "短休息", duration: 5 * 60, color: "#22c55e" },
  longBreak: { label: "长休息", duration: 15 * 60, color: "#3b82f6" },
};

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("work");
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.work.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const totalSeconds = MODE_CONFIG[mode].duration;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === "work") {
              setCompletedPomodoros(p => p + 1);
              const nextMode: Mode = (p => p % 4 === 0 ? "longBreak" : "shortBreak")(completedPomodoros + 1);
              setTimeout(() => { setMode(nextMode); setTimeLeft(MODE_CONFIG[nextMode].duration); }, 500);
              return 0;
            }
            setTimeout(() => { setMode("work"); setTimeLeft(MODE_CONFIG.work.duration); setIsRunning(true); }, 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return \`\${m}:\${sec}\`;
  };

  const switchMode = (m: Mode) => { setMode(m); setTimeLeft(MODE_CONFIG[m].duration); setIsRunning(false); };
  const reset = () => { setTimeLeft(totalSeconds); setIsRunning(false); };

  const config = MODE_CONFIG[mode];
  const radius = 90;
  const size = 220;

  return (
    <div style={{ padding: 24, background: "#09090b", color: "#fafaf9", fontFamily: "system-ui", minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Stats */}
      <div style={{ display: "flex", gap: 24, marginBottom: 28 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: config.color }}>{completedPomodoros}</div>
          <div style={{ fontSize: 12, color: "#71717a" }}>今日番茄</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{Math.round(completedPomodoros * 25)}</div>
          <div style={{ fontSize: 12, color: "#71717a" }}>专注分钟</div>
        </div>
      </div>

      {/* Circular timer */}
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#27272a" strokeWidth="6"/>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={config.color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}/>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: -2 }}>{formatTime(timeLeft)}</div>
          <div style={{ fontSize: 13, color: config.color, marginTop: 4 }}>{config.label}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
        <button onClick={() => setIsRunning(r => !r)} style={{
          padding: "12px 36px", borderRadius: 12, border: "none", cursor: "pointer",
          fontSize: 15, fontWeight: 600, background: isRunning ? "#dc2626" : config.color, color: "white"
        }}>{isRunning ? "暂停" : "开始"}</button>
        <button onClick={reset} style={{
          padding: "12px 24px", borderRadius: 12, border: "1px solid #3f3f46", cursor: "pointer",
          fontSize: 14, background: "transparent", color: "#a1a1aa"
        }}>重置</button>
      </div>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        {(Object.entries(MODE_CONFIG) as [Mode, typeof MODE_CONFIG.work][]).map(([key, cfg]) => (
          <button key={key} onClick={() => switchMode(key)} style={{
            padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
            background: mode === key ? \`\${cfg.color}30\` : "#18181b", color: mode === key ? cfg.color : "#71717a",
            fontWeight: mode === key ? 600 : 400
          }}>{cfg.label}</button>
        ))}
      </div>
    </div>
  );
}`,
      dependencies: {},
    },
  },
  {
    id: "app-notes",
    name: "便签笔记板",
    description: "彩色便签墙，支持多颜色分类、富文本编辑、搜索、置顶、Markdown 渲染",
    category: "productivity",
    tags: ["React", "Context", "Drag"],
    stars: 298,
    downloads: 1560,
    gradient: "from-yellow-500 to-amber-600",
    icon: StickyNote,
    panels: 2,
    techStack: ["React 18", "TypeScript", "Context API"],
    difficulty: "beginner",
    estimatedTime: "7分钟",
    features: [
      "多彩便签卡片（黄/粉/蓝/绿/紫）",
      "创建 / 编辑 / 删除便签",
      "置顶固定功能",
      "关键词搜索过滤",
      "便签拖拽排列",
      "自动保存到 LocalStorage",
    ],
    previewCode: {
      react: `import { useState, useMemo } from "react";

interface Note { id: number; title: string; body: string; color: string; pinned: boolean; createdAt: number; }

const COLORS = [
  { name: "yellow", bg: "#fef08a", text: "#854d0e", accent: "#ca8a04" },
  { name: "pink",   bg: "#fbcfe8", text: "#9d174d", accent: "#db2777" },
  { name: "blue",   bg: "#bfdbfe", text: "#1e40af", accent: "#2563eb" },
  { name: "green",  bg: "#bbf7d0", text: "#166534", accent: "#16a34a" },
  { name: "purple", bg: "#e9d5ff", text: "#6b21a8", accent: "#9333ea" },
];

const initialNotes: Note[] = [
  { id: 1, title: "项目计划", body: "1. 完成首页设计\\n2. 开发 API 接口\\n3. 编写单元测试", color: COLORS[0].name, pinned: true, createdAt: Date.now() - 86400000 },
  { id: 2, title: "会议纪要", body: "讨论了 Q2 目标和资源分配，下周三前提交方案。", color: COLORS[1].name, pinned: false, createdAt: Date.now() - 3600000 },
  { id: 3, title: "读书笔记", body: "《代码整洁之道》第三章：函数应该短小精悍。", color: COLORS[2].name, pinned: false, createdAt: Date.now() - 7200000 },
  { id: 4, title: "灵感收集", body: "• 暗色模式渐变背景\\n• 卡片悬浮动效\\n• 骨架屏加载", color: COLORS[3].name, pinned: true, createdAt: Date.now() - 172800000 },
  { id: 5, title: "购物清单", body: "牛奶、面包、鸡蛋、咖啡豆、水果", color: COLORS[4].name, pinned: false, createdAt: Date.now() },
];

export default function NotesBoard() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0].name);

  const getColor = (name: string) => COLORS.find(c => c.name === name) || COLORS[0];

  const filtered = useMemo(() => {
    if (!search) return notes;
    const q = search.toLowerCase();
    return notes.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
  }, [notes, search]);

  const addNote = () => {
    if (!newTitle.trim()) return;
    setNotes([{ id: Date.now(), title: newTitle, body: newBody, color: newColor, pinned: false, createdAt: Date.now() }, ...notes]);
    setNewTitle(""); setNewBody(""); setShowForm(false);
  };

  const deleteNote = (id: number) => setNotes(notes.filter(n => n.id !== id));
  const togglePin = (id: number) => setNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div style={{ padding: 20, background: "#1a1a2e", color: "#e2e8f0", fontFamily: "system-ui", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>📝 便签墙</h1>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索..."
          style={{ flex:1,padding:"8px 14px",borderRadius:10,border:"1px solid #334155",background:"#16213e",color:"#e2e8f0",fontSize:13,outline:"none" }} />
        <button onClick={()=>setShowForm(!showForm)} style={{
          padding:"8px 18px",borderRadius:10,border:"none",background:"#6366f1",color:"white",cursor:pointer,fontSize:13,fontWeight:600
        }}>+ 新建</button>
      </div>

      {/* New note form */}
      {showForm && (
        <div style={{ background: "#16213e", borderRadius: 14, padding: 16, marginBottom: 16, border: "1px solid #334155" }}>
          <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="标题..." autoFocus
            style={{width:"100%",padding:"8px 12px",marginBottom:8,borderRadius:8,border:"1px solid #334155",background:"#0f172a",color:"#e2e8f0",outline:"none",fontSize:14}} />
          <textarea value={newBody} onChange={e=>setNewBody(e.target.value)} placeholder="内容..."
            rows={3} style={{width:"100%",padding:"8px 12px",marginBottom:8,borderRadius:8,border:"1px solid #334155",background:"#0f172a",color:"#e2e8f0",outline:"none",fontSize:13,resize:"none"}} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {COLORS.map(c => (
                <button key={c.name} onClick={()=>setNewColor(c.name)} style={{
                  width: 24, height: 24, borderRadius: "50%", background: c.bg,
                  border: newColor===c.name?\`2px solid \${c.accent}\`:"2px solid transparent", cursor: "pointer"
                }} />
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={()=>setShowForm(false)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:"#374151",color:"#d1d5db",cursor:"pointer",fontSize:12}}>取消</button>
            <button onClick={addNote} style={{padding:"6px 14px",borderRadius:8,border:"none",background:"#6366f1",color:"white",cursor:"pointer",fontSize:12,fontWeight:600}}>创建</button>
          </div>
        </div>
      )}

      {/* Notes grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
        {sorted.map(note => {
          const c = getColor(note.color);
          return (
            <div key={note.id} style={{
              background: c.bg, color: c.text, borderRadius: 14, padding: 16,
              boxShadow: note.pinned ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.15)",
              transform: note.pinned ? "scale(1.02)" : "scale(1)", transition: "transform 0.2s",
              position: "relative", minHeight: 140
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: c.accent }}>{note.title}</h3>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={()=>togglePin(note.id)} style={{
                    background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: note.pinned?1:0.4
                  }}>📌</button>
                  <button onClick={()=>deleteNote(note.id)} style={{
                    background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: 0.4
                  }}>×</button>
                </div>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{note.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}`,
      dependencies: {},
    },
  },
  {
    id: "app-stopwatch",
    name: "多功能秒表",
    description: "精确秒表工具，支持分圈计时、分段记录、毫秒精度、导出记录",
    category: "utility",
    tags: ["React", "Performance", "Date"],
    stars: 267,
    downloads: 1340,
    gradient: "from-blue-500 to-indigo-600",
    icon: Timer,
    panels: 1,
    techStack: ["React 18", "TypeScript", "performance.now()"],
    difficulty: "beginner",
    estimatedTime: "5分钟",
    features: [
      "毫秒级精度计时显示",
      "分圈/计次记录（Lap）",
      "最佳/最差圈速高亮",
      "暂停后可继续",
      "一键清零重置",
      "大字体清晰展示",
    ],
    previewCode: {
      react: `import { useState, useRef, useCallback, useEffect } from "react";

interface Lap { id: number; time: number; diff: number; best?: boolean; worst?: boolean; }

export default function Stopwatch() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const lastLapRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      startTimeRef.current = performance.now();
      const tick = () => {
        if (startTimeRef.current !== null) {
          setTime(accumulatedRef.current + (performance.now() - startTimeRef.current));
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [running]);

  const format = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return \`\${String(m).padStart(2,"0")}:\${String(s).padStart(2,"0")}.\${String(cs).padStart(2,"0")}\`;
  };

  const startStop = useCallback(() => {
    if (running) {
      if (startTimeRef.current) {
        accumulatedRef.current += performance.now() - startTimeRef.current;
      }
      setRunning(false);
    } else {
      setRunning(true);
    }
  }, [running]);

  const lap = useCallback(() => {
    if (!running || laps.length >= 20) return;
    const currentTime = time;
    const lapTime = currentTime - lastLapRef.current;
    lastLapRef.current = currentTime;
    const prevLaps = laps.map(l => l.diff);
    const minDiff = prevLaps.length ? Math.min(...prevLaps) : Infinity;
    const maxDiff = prevLaps.length ? Math.max(...prevLaps) : 0;
    setLaps([...laps, {
      id: laps.length + 1, time: currentTime, diff: lapTime,
      best: prevLaps.length > 0 && lapTime <= minDiff,
      worst: prevLaps.length > 0 && lapTime >= maxDiff,
    }]);
  }, [running, time, laps]);

  const reset = useCallback(() => {
    setTime(0); setRunning(false); setLaps([]);
    accumulatedRef.current = 0; lastLapRef.current = 0; startTimeRef.current = null;
  }, []);

  const hasLaps = laps.length > 0;
  const bestLap = hasLaps ? laps.reduce((a, b) => a.diff < b.diff ? a : b) : null;
  const worstLap = hasLaps ? laps.reduce((a, b) => a.diff > b.diff ? a : b) : null;

  return (
    <div style={{ padding: 32, background: "#0a0a0f", color: "#e2e8f0", fontFamily: "'SF Mono', 'Fira Code', monospace", minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Time display */}
      <div style={{
        fontSize: 64, fontWeight: 200, fontVariantNumeric: "tabular-nums", letterSpacing: 4,
        textShadow: running ? "0 0 40px rgba(99,102,241,0.3)" : "none",
        transition: "text-shadow 0.3s"
      }}>
        {format(time)}
      </div>
      <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4, letterSpacing: 8 }}>mm:ss.cs</div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
        {!running && time === 0 && (
          <button onClick={startStop} style={{
            width: 80, height: 80, borderRadius: "50%", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600, background: "#3b82f6", color: "white"
          }}>开始</button>
        )}
        {running && (
          <>
            <button onClick={lap} style={{
              width: 72, height: 72, borderRadius: "50%", border: "2px solid #4b5563", cursor: "pointer",
              fontSize: 13, fontWeight: 600, background: "transparent", color: "#9ca3af"
            }}>计次</button>
            <button onClick={startStop} style={{
              width: 80, height: 80, borderRadius: "50%", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 600, background: "#f59e0b", color: "#000"
            }}>停止</button>
          </>
        )}
        {!running && time > 0 && (
          <>
            <button onClick={lap} style={{
              width: 72, height: 72, borderRadius: "50%", border: "2px solid #4b5563", cursor: "pointer",
              fontSize: 13, fontWeight: 600, background: "transparent", color: "#9ca3af", opacity: 0.4
            }}>计次</button>
            <button onClick={startStop} style={{
              width: 72, height: 72, borderRadius: "50%", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 600, background: "#22c55e", color: "white"
            }}>继续</button>
            <button onClick={reset} style={{
              width: 64, height: 64, borderRadius: "50%", border: "2px solid #ef4444", cursor: "pointer",
              fontSize: 13, fontWeight: 600, background: "transparent", color: "#ef4444"
            }}>复位</button>
          </>
        )}
      </div>

      {/* Laps table */}
      {hasLaps && (
        <div style={{ marginTop: 36, width: "100%", maxWidth: 320 }}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8, textAlign: "center" }}>
            计次记录 ({laps.length})
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {[...laps].reverse().map(lapItem => (
              <div key={lapItem.id} style={{
                display: "flex", justifyContent: "space-between", padding: "8px 12px",
                borderBottom: "1px solid #1f2937", fontSize: 13
              }}>
                <span style={{ color: lapItem.best ? "#34d399" : lapItem.worst ? "#f87171" : "#9ca3af" }}>
                  圈 {lapItem.id} {lapItem.best ? "★ 最佳" : lapItem.worst ? "△ 最慢" : ""}
                </span>
                <span style={{ color: "#e5e7eb" }}>{format(lapItem.diff)}</span>
                <span style={{ color: "#6b7280" }}>{format(lapItem.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}`,
      dependencies: {},
    },
  },
  {
    id: "app-converter",
    name: "万能单位换算器",
    description: "长度/重量/温度/速度/面积等多维度换算，实时计算、常用单位收藏",
    category: "utility",
    tags: ["React", "Math", "State"],
    stars: 234,
    downloads: 1120,
    gradient: "from-violet-500 to-purple-600",
    icon: ArrowLeftRight,
    panels: 1,
    techStack: ["React 18", "TypeScript"],
    difficulty: "beginner",
    estimatedTime: "5分钟",
    features: [
      "长度换算（米/英尺/英寸/公里/英里）",
      "重量换算（千克/磅/盎司/吨）",
      "温度换算（摄氏/华氏/开尔文）",
      "速度换算（km/h/mph/m/s/knots）",
      "双向实时转换",
      "常用单位快速选择",
    ],
    previewCode: {
      react: `import { useState, useMemo } from "react";

interface Unit { label: string; toBase: (v: number) => number; fromBase: (v: number) => number; }

const CATEGORIES: Record<string, { name: string; units: Unit[] }> = {
  length: {
    name: "长度",
    units: [
      { label: "米 (m)",       toBase: v => v,           fromBase: v => v },
      { label: "千米 (km)",    toBase: v => v * 1000,     fromBase: v => v / 1000 },
      { label: "厘米 (cm)",    toBase: v => v / 100,      fromBase: v => v * 100 },
      { label: "英尺 (ft)",    toBase: v => v * 0.3048,   fromBase: v => v / 0.3048 },
      { label: "英寸 (in)",    toBase: v => v * 0.0254,   fromBase: v => v / 0.0254 },
      { label: "英里 (mi)",    toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
    ],
  },
  weight: {
    name: "重量",
    units: [
      { label: "千克 (kg)",    toBase: v => v,           fromBase: v => v },
      { label: "克 (g)",       toBase: v => v / 1000,     fromBase: v => v * 1000 },
      { label: "吨 (t)",       toBase: v => v * 1000,     fromBase: v => v / 1000 },
      { label: "磅 (lb)",      toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
      { label: "盎司 (oz)",    toBase: v => v * 0.02835,  fromBase: v => v / 0.02835 },
    ],
  },
  temperature: {
    name: "温度",
    units: [
      { label: "摄氏度 (°C)",  toBase: v => v,             fromBase: v => v },
      { label: "华氏度 (°F)",  toBase: v => (v - 32) * 5/9, fromBase: v => v * 9/5 + 32 },
      { label: "开尔文 (K)",   toBase: v => v - 273.15,    fromBase: v => v + 273.15 },
    ],
  },
  speed: {
    name: "速度",
    units: [
      { label: "km/h",         toBase: v => v / 3.6,       fromBase: v => v * 3.6 },
      { label: "m/s",          toBase: v => v,             fromBase: v => v },
      { label: "mph",          toBase: v => v * 0.44704,   fromBase: v => v / 0.44704 },
      { label: "节 (knots)",   toBase: v => v * 0.514444,  fromBase: v => v / 0.514444 },
    ],
  },
};

export default function UnitConverter() {
  const [category, setCategory] = useState<keyof typeof CATEGORIES>("length");
  const [fromUnitIdx, setFromUnitIdx] = useState(0);
  const [toUnitIdx, setToUnitIdx] = useState(1);
  const [value, setValue] = useState("1");

  const cat = CATEGORIES[category];
  const numValue = parseFloat(value) || 0;

  const result = useMemo(() => {
    const baseVal = cat.units[fromUnitIdx].toBase(numValue);
    return cat.units[toUnitIdx].fromBase(baseVal);
  }, [category, fromUnitIdx, toUnitIdx, numValue, cat]);

  const fmt = (v: number) => {
    if (Math.abs(v) >= 1e6) return v.toExponential(4);
    if (Math.abs(v) < 0.001 && v !== 0) return v.toExponential(4);
    return parseFloat(v.toPrecision(8)).toString();
  };

  const swapUnits = () => {
    setFromUnitIdx(toUnitIdx);
    setToUnitIdx(fromUnitIdx);
  };

  return (
    <div style={{ padding: 24, background: "#0f0f1a", color: "#c4b5fd", fontFamily: "system-ui", minHeight: "100%", maxWidth: 420, margin: "0 auto" }}>
      {/* Category tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        {(Object.entries(CATEGORIES) as [keyof typeof CATEGORIES, typeof CATEGORIES[keyof typeof CATEGORIES]][]).map(([key, c]) => (
          <button key={key} onClick={() => { setCategory(key); setFromUnitIdx(0); setToUnitIdx(1); }} style={{
            padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13,
            background: category === key ? "#7c3aed30" : "#1e1b4b", color: category === key ? "#a78bfa" : "#6b7280",
            fontWeight: category === key ? 600 : 400
          }}>{c.name}</button>
        ))}
      </div>

      {/* Converter card */}
      <div style={{ background: "#1e1b4b", borderRadius: 20, padding: 24, border: "1px solid #312e81" }}>
        {/* From unit */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>从</label>
          <select value={fromUnitIdx} onChange={e=>setFromUnitIdx(+e.target.value)} style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #3730a3",
            background: "#0f0f1a", color: "#e2e8f0", fontSize: 14, cursor: "pointer", outline: "none"
          }}>{cat.units.map((u,i)=><option key={i} value={i}>{u.label}</option>)}</select>
          <input type="number" value={value} onChange={e=>setValue(e.target.value)} step="any"
            style={{ width: "100%", marginTop: 8, padding: "12px 16px", borderRadius: 12, border: "1px solid #3730a3",
              background: "#0f0f1a", color: "#fff", fontSize: 22, fontWeight: 700, outline: "none",
              fontVariantNumeric: "tabular-nums", textAlign: "center" }} />
        </div>

        {/* Swap button */}
        <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
          <button onClick={swapUnits} style={{
            width: 40, height: 40, borderRadius: "50%", border: "1px solid #6d28d9", cursor: "pointer",
            background: "#4c1d95", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
          }}>⇅</button>
        </div>

        {/* To unit */}
        <div>
          <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>到</label>
          <select value={toUnitIdx} onChange={e=>setToUnitIdx(+e.target.value)} style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #3730a3",
            background: "#0f0f1a", color: "#e2e8f0", fontSize: 14, cursor: "pointer", outline: "none"
          }}>{cat.units.map((u,i)=><option key={i} value={i}>{u.label}</option>)}</select>
          <div style={{
            marginTop: 8, padding: "14px 16px", borderRadius: 12, background: "#2e1065",
            textAlign: "center", fontSize: 22, fontWeight: 700, color: "#ddd6fe", fontVariantNumeric: "tabular-nums"
          }}>{fmt(result)}</div>
        </div>
      </div>

      {/* Formula hint */}
      <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "#6b7280" }}>
        1 {cat.units[fromUnitIdx].label} = {fmt(cat.units[fromUnitIdx].toBase(1) === 1 ? 1 : cat.units[fromUnitIdx].toBase(1))} {cat.units[toUnitIdx].label}
      </div>
    </div>
  );
}`,
      dependencies: {},
    },
  },
  {
    id: "app-counter",
    name: "数据计数器仪表盘",
    description: "多维度实时计数器，支持步进调节、目标设定、历史趋势图、百分比进度",
    category: "dashboard",
    tags: ["React", "State", "Animation"],
    stars: 198,
    downloads: 980,
    gradient: "from-teal-500 to-cyan-600",
    icon: TrendingUp,
    panels: 2,
    techStack: ["React 18", "TypeScript", "CSS Animation"],
    difficulty: "beginner",
    estimatedTime: "5分钟",
    features: [
      "多个独立计数器（可自定义名称）",
      "+/- 步进按钮 + 直接输入数值",
      "目标值设定 + 进度条可视化",
      "增减操作带数字滚动动画",
      "计数器分组管理",
      "总计汇总面板",
    ],
    previewCode: {
      react: `import { useState, useCallback } from "react";

interface Counter { id: number; name: string; value: number; target: number; step: number; color: string; }

const INITIAL: Counter[] = [
  { id: 1, name: "今日访客", value: 1284, target: 2000, step: 10, color: "#06b6d4" },
  { id: 2, name: "新增用户", value: 86, target: 150, step: 1, color: "#8b5cf6" },
  { id: 3, name: "订单数", value: 43, target: 100, step: 1, color: "#f59e0b" },
  { id: 4, name: "转化率 %", value: 3.2, target: 5.0, step: 0.1, color: "#10b981" },
];

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  useState(() => { setDisplay(value); });
  setDisplay(value);
  return <span>{typeof display === "number" ? display.toFixed(decimals) : value.toFixed(decimals)}</span>;
}

export default function CounterDashboard() {
  const [counters, setCounters] = useState(INCREMENTAL_COUNTERS ?? INITIAL);

  const INCREMENTAL_COUNTERS = counters;

  const adjust = useCallback((id: number, delta: number) => {
    setCounters(counters.map(c =>
      c.id === id ? { ...c, value: Math.max(0, +(c.value + delta).toFixed(2)) } : c
    ));
  }, [counters]);

  const setTarget = useCallback((id: number, target: number) => {
    setCounters(counters.map(c => c.id === id ? { ...c, target: Math.max(0, target) } : c));
  }, [counters]);

  const total = counters.reduce((sum, c) => sum + c.value, 0);
  const avgProgress = counters.reduce((sum, c) => sum + (c.target > 0 ? (c.value / c.target) * 100 : 0), 0) / counters.length;

  return (
    <div style={{ padding: 24, background: "#042f2e", color: "#ccfbf1", fontFamily: "system-ui", minHeight: "100%" }}>
      {/* Summary bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "#0d3d3a", borderRadius: 14, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#5eead4" }}>总计数</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{total.toLocaleString()}</div>
        </div>
        <div style={{ background: "#0d3d3a", borderRadius: 14, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#5eead4" }}>平均进度</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{avgProgress.toFixed(1)}%</div>
        </div>
        <div style={{ background: "#0d3d3a", borderRadius: 14, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#5eead4" }}>活跃指标</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{counters.length}</div>
        </div>
      </div>

      {/* Counters */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
        {counters.map(counter => {
          const pct = counter.target > 0 ? Math.min(100, (counter.value / counter.target) * 100) : 0;
          return (
            <div key={counter.id} style={{
              background: "#0d3d3a", borderRadius: 16, padding: 20, border: "1px solid #134e4a"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{counter.name}</span>
                <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 6, background: \`\${counter.color}20\`, color: counter.color }}>
                  目标: {counter.target}
                </span>
              </div>

              {/* Value display */}
              <div style={{ textAlign: "center", margin: "16px 0" }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: counter.counter?.color || counter.color, fontVariantNumeric: "tabular-nums" }}>
                  {counter.value % 1 === 0 ? counter.value.toLocaleString() : counter.value.toFixed(1)}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 3, background: "#134e4a", marginBottom: 12 }}>
                <div style={{
                  width: \`\${pct}%\`, height: "100%", borderRadius: 3,
                  background: \`linear-gradient(90deg,\${counter.color},\${counter.color}80)\`,
                  transition: "width 0.3s ease"
                }} />
              </div>

              {/* Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => adjust(counter.id, -counter.step)} style={{
                  width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
                  background: "#1e3a3a", color: counter.color, fontSize: 20, fontWeight: 700
                }}>-</button>
                <button onClick={() => adjust(counter.id, counter.step)} style={{
                  width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
                  background: "#1e3a3a", color: counter.color, fontSize: 20, fontWeight: 700
                }}>+</button>
                <span style={{ flex: 1, textAlign: "right", fontSize: 12, color: "#5eead4" }}>
                  {pct.toFixed(0)}% 完成
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const COUNTERS_DATA = [
  { id: 1, name: "今日访客", value: 1284, target: 2000, step: 10, color: "#06b6d4" },
  { id: 2, name: "新增用户", value: 86, target: 150, step: 1, color: "#8b5cf6" },
  { id: 3, name: "订单数", value: 43, target: 100, step: 1, color: "#f59e0b" },
  { id: 4, name: "转化率 %", value: 3.2, target: 5.0, step: 0.1, color: "#10b981" },
];`,
      dependencies: {},
    },
  },
  {
    id: "app-weather",
    name: "天气信息面板",
    description: "精美天气展示组件，模拟城市天气数据、7日预报、空气质量指数、UV指数",
    category: "widget",
    tags: ["React", "API Mock", "Icons"],
    stars: 312,
    downloads: 1780,
    gradient: "from-sky-400 to-blue-500",
    icon: CloudSun,
    panels: 1,
    techStack: ["React 18", "TypeScript", "Mock Data"],
    difficulty: "beginner",
    estimatedTime: "6分钟",
    features: [
      "当前温度 + 体感温度 + 天气图标",
      "湿度 / 风速 / 气压 / 能见度",
      "7 日天气预报列表",
      "空气质量 AQI 指数",
      "UV 指数 + 日出日落时间",
      "城市切换下拉菜单",
    ],
    previewCode: {
      react: `const WEATHER_DATA = {
  city: "北京", temp: 23, feelsLike: 21, condition: "多云", icon: "⛅",
  humidity: 65, wind: 12, pressure: 1013, visibility: 10, uv: 6, aqi: 82,
  sunrise: "05:42", sunset: "19:18",
  forecast: [
    { day: "今天", high: 26, low: 18, icon: "⛅", pop: 20 },
    { day: "明天", high: 28, low: 19, icon: "☀️", pop: 0 },
    { day: "周三", high: 25, low: 17, icon: "🌧️", pop: 60 },
    { day: "周四", high: 22, low: 15, icon: "🌧️", pop: 80 },
    { day: "周五", high: 24, low: 16, icon: "⛅", pop: 30 },
    { day: "周六", high: 27, low: 18, icon: "☀️", pop: 10 },
    { day: "周日", high: 29, low: 20, icon: "☀️", pop: 5 },
  ]
};

const AQI_LEVELS = [
  { max: 50, label: "优", color: "#22c55e" },
  { max: 100, label: "良", color: "#eab308" },
  { max: 150, label: "轻度污染", color: "#f97316" },
  { max: 200, label: "中度污染", color: "#ef4444" },
  { max: 300, label: "重度污染", color: "#a855f7" },
  { max: Infinity, label: "严重污染", color: "#7c2d12" },
];

export default function WeatherPanel() {
  const w = WEATHER_DATA;
  const aqiLevel = AQI_LEVELS.find(l => w.aqi <= l.max) || AQI_LEVELS[AQI_LEVELS.length - 1];
  const uvLabel = w.uv <= 2 ? "低" : w.uv <= 5 ? "中等" : w.uv <= 7 ? "高" : w.uv <= 10 ? "很高" : "极高";

  return (
    <div style={{ padding: 24, background: "linear-gradient(180deg,#0c1929 0%,#1a365d 100%)", color: "#e2e8f0", fontFamily: "system-ui", minHeight: "100%", maxWidth: 380, margin: "0 auto", borderRadius: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>📍 {w.city}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{w.condition}</div>
        </div>
        <select style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: 12, cursor: "pointer" }}>
          <option>北京</option><option>上海</option><option>广州</option><option>深圳</option><option>杭州</option>
        </select>
      </div>

      {/* Main temp */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 64, fontWeight: 200 }}>{w.icon}</div>
        <div style={{ fontSize: 56, fontWeight: 200, lineHeight: 1 }}>{w.temp}°</div>
        <div style={{ fontSize: 14, color: "#94a3b8" }}>体感 {w.feelsLike}°C</div>
      </div>

      {/* Details grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "💧 湿度", value: \`\${w.humidity}%\` },
          { label: "💨 风速", value: \`\${w.wind} km/h\` },
          { label: "🔵 气压", value: \`\${w.pressure} hPa\` },
          { label: "👁️ 能见度", value: \`\${w.visibility} km\` },
        ].map(d => (
          <div key={d.label} style={{ background: "#1e293b40", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "#64748b" }}>{d.label}</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{d.value}</div>
          </div>
        ))}
      </div>

      {/* AQI & UV */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <div style={{ background: "#1e293b40", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>空气品质</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: aqiLevel.color }}>{w.aqi}</span>
            <span style={{ fontSize: 12, color: aqiLevel.color }}>{aqiLevel.label}</span>
          </div>
        </div>
        <div style={{ background: "#1e293b40", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>紫外线</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#f59e0b" }}>{w.uv}</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{uvLabel}</span>
          </div>
        </div>
      </div>

      {/* Sun times */}
      <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 20, padding: "12px", background: "#1e293b20", borderRadius: 10 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18 }}>🌅</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>日出</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{w.sunrise}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18 }}>🌇</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>日落</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{w.sunset}</div>
        </div>
      </div>

      {/* Forecast */}
      <div style={{ background: "#1e293b30", borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>7 日预报</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {w.forecast.map(f => (
            <div key={f.day} style={{ textAlign: "center", minWidth: 36 }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{f.day.replace("周","").replace("今","今")}</div>
              <div style={{ fontSize: 20, margin: "4px 0" }}>{f.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{f.high}°</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{f.low}°</div>
              {f.pop > 0 && <div style={{ fontSize: 9, color: "#60a5fa" }}>💧{f.pop}%</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,
      dependencies: {},
    },
  },
];

export const APP_TEMPLATE_CATEGORIES = [
  { id: "all", label: "全部轻量应用", count: APP_TEMPLATES.length },
  { id: "utility", label: "实用工具", count: APP_TEMPLATES.filter(t => t.category === "utility").length },
  { id: "productivity", label: "效率工具", count: APP_TEMPLATES.filter(t => t.category === "productivity").length },
  { id: "widget", label: "小组件", count: APP_TEMPLATES.filter(t => t.category === "widget").length },
  { id: "dashboard", label: "仪表板", count: APP_TEMPLATES.filter(t => t.category === "dashboard").length },
];
