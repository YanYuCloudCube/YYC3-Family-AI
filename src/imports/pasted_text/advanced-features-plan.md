## 当前实现进度

### ✅ 已完成

1. **AI 代码生成流水线** (Wave 2 - F2.1)
   - `ContextCollector.ts` — 从 FileStore 收集项目上下文（文件树、活跃文件、Git 状态等）
   - `SystemPromptBuilder.ts` — 意图检测（8 种意图）+ 上下文感知 System Prompt 构建
   - `CodeApplicator.ts` — LLM 响应解析（代码块提取、文件路径推断、Diff 预览）
   - `AIPipeline.ts` — 端到端编排器，串联 Context → Prompt → LLM → CodeApplicator
   - **集成**: LeftPanel.tsx `handleSend` 已升级为使用 `runPipeline`，支持自动应用多文件代码计划

2. **可扩展终端命令系统** (Wave 1 - F1.3 部分)
   - `CommandRegistry.ts` — 20+ 内置命令（ls/cat/grep/find/tree/touch/mkdir/rm/mv/cp/wc/head/tail/git/npm/node/tsc 等）
   - 支持引号解析、`&&` 连接、Tab 补全
   - **集成**: Terminal.tsx 已从硬编码 `simulateCommand` 迁移至 `CommandRegistry`，命令操作实际读写 FileStore

3. **IndexedDB 文件持久化** (Wave 1 - F1.1)
   - `IndexedDBAdapter.ts` — 完整的 IndexedDB 封装（files/projects/snapshots 三个 store）
   - 支持防抖保存、立即保存、快照管理、存储容量检测
   - **集成**: FileStoreProvider 自动防抖保存到 IndexedDB，挂载时恢复持久化文件；create/delete/rename 立即写入

4. **项目导出/导入** (Wave 1 相关)
   - `ProjectExporter.ts` — ZIP/JSON 双格式导出导入，含 package.json/tsconfig/vite.config 自动生成
   - **集成**: TopBar.tsx 新增 Export Dropdown（导出为 ZIP / 导出为 JSON），含文件计数展示

5. **事件总线扩展**
   - `WorkflowEventBus.tsx` 新增 `code-applied` 事件类型 + stage 映射

6. **Vitest 测试覆盖**
   - `AIPipeline.test.ts` — 65+ assertions 覆盖 ContextCollector、SystemPromptBuilder、CodeApplicator、ProjectExporter
   - `CommandRegistry.test.ts` — 40+ test cases 覆盖全部 20+ 内置命令、Tab 补全、命令行解析
   - `WorkflowEventBus.test.ts` 已更新包含 `code-applied` 事件

7. **Sandpack 实时预览** (Wave 1 - F1.2)
   - `SandpackPreview.tsx` — 基于 `@codesandbox/sandpack-react` 的实时预览面板
   - 将 FileStore 文件自动转换为 Sandpack 沙箱格式，支持热重载
   - 响应式设备切换（桌面/平板/手机），含控制台面板
   - **集成**: IDEPage.tsx `PreviewContent` 已替换为 `SandpackPreviewPanel`

8. **AI 代码变更 Diff 预览模态** (AI Pipeline UX 润色)
   - `DiffPreviewModal.tsx` — 逐文件差异预览 + 接受/拒绝
   - 功能: 行级 diff 高亮（新增/删除/不变）、逐文件 checkbox 接受/拒绝、全选/全不选、代码验证警告、变更统计
   - **集成**: LeftPanel.tsx `handleSend` 流水线完成后不再自动应用代码，而是 `setPendingPlan` 展示 DiffPreviewModal，用户确认后才应用选中文件

9. **智能错误检测和修复** (Wave 2 - F2.2)
   - `ErrorAnalyzer.ts` — 静态分析引擎，25+ 条规则覆盖 9 大类别:
     - TypeScript: any 使用、非空断言、console.log、TODO/FIXME
     - React: 缺少 key、直接修改 state、不必要 Fragment
     - Hooks: 空依赖数组引用外部变量、条件语句中调用 Hook
     - 导入: 重复导入、不必要的 React 默认导入
     - 性能: 内联 style 对象、匿名组件、索引作为 key、大型内联数组
     - 可访问性: 图片缺少 alt、button 缺少 type、onClick 无键盘事件
     - 样式: 硬编码颜色值、!important 使用
     - 安全: dangerouslySetInnerHTML、eval()、硬编码密钥
     - 最佳实践: 空 catch、魔法数字、嵌套三元、函数过长
   - `useErrorDiagnostics.ts` — 响应式 Hook，防抖监听文件变更并自动触发分析，支持增量/全量模式
   - `ErrorDiagnosticsPanel.tsx` — 完整的诊断面板 UI:
     - 按文件分组 / 平铺两种视图模式
     - 按严重度(error/warning/info/hint)过滤 + 搜索 + 文件路径过滤
     - 点击诊断定位到文件
     - 一键 AutoFix（对支持的规则自动修复）
     - AI 辅助修复按钮（将诊断上下文发送给 LLM）
     - 实时统计 + 分析时间展示
   - **集成**: PanelManager 新增 `"diagnostics"` PanelId；PanelQuickAccess 新增快捷入口；IDEPage renderPanel 已注册；WorkflowEventBus 新增 3 个诊断事件类型

10. **ErrorAnalyzer 单元测试** (测试覆盖)
    - `ErrorAnalyzer.test.ts` — 完整测试覆盖全部 27 条规则
    - 每条规则至少 2 个测试用例（触发 + 不触发），含边界情况和性能测试
    - 覆盖: analyzeFile / analyzeProject / applyAutoFix / buildFixPromptContext / getRuleDescriptions
    - 验证: severity 分级排序、唯一 ID 生成、非代码文件跳过、类别完整性（9 类全覆盖）

11. **AI 修复按钮 → LeftPanel LLM 调用集成**
    - `useAIFixStore.ts` — 跨面板 AI 修复请求 Zustand store（requestFix / consumeRequest）
    - ErrorDiagnosticsPanel 点击 AI 修复按钮 → 调用 `requestFix(prompt, filepath)`
    - LeftPanel useEffect 监听 `pendingRequest` → 消费请求 → 注入聊天消息 → 触发 handleSend 调用 LLM
    - **集成**: 修复了 LeftPanel.tsx 全部丢失的 import 语句（React / lucide-react / FileStore / ModelRegistry / WorkflowEventBus / LLMService / ChatHistoryStore）

12. **智能性能优化建议** (Wave 2 - F2.3)
    - `PerformanceOptimizer.ts` — 18 条性能优化规则覆盖 8 大类别:
      - 渲染优化: 组件未 memo、对象/数组字面量 prop、内联箭头函数 prop
      - 状态管理: 过多 useState、派生状态、Context value 未 memo
      - 缓存策略: 渲染中未缓存的 filter/sort/reduce、函数未 useCallback
      - 代码分割: 大组件文件(>300行)、顶层导入重量级库
      - 资源优化: 图片未懒加载、图片缺少宽高属性
      - 内存管理: useEffect 未清理订阅/定时器、闭包捕获大型数据
      - 网络优化: 搜索输入未防抖、渲染中直接 fetch
      - 打包优化: 桶文件导入、动态 import 模板字符串
    - `PerformancePanel.tsx` — 完整的性能优化面板 UI:
      - 0-100 性能得分可视化 + 类别分布
      - 按文件分组展示，每个文件单独评分
      - 高/中/低影响过滤 + 搜索
      - 代码示例折叠（优化前/优化后对比）
      - 文档链接 + AI 优化按钮（通过 useAIFixStore 接入 LLM）
      - 高影响问题 banner 提醒
    - **集成**: PanelManager 新增 `"performance"` PanelId；PanelQuickAccess 新增快捷入口；IDEPage renderPanel 已注册

13. **智能安全扫描** (Wave 2 - F2.4)
    - `SecurityScanner.ts` — 22 条安全扫描规则覆盖 10 大类别:
      - XSS: dangerouslySetInnerHTML、innerHTML 赋值、javascript: 协议、document.write
      - 注入: eval()/new Function()、SQL 字符串拼接
      - 敏感数据: 硬编码密钥（8种模式: OpenAI/GitHub/Google/AWS/Slack/私钥等）、日志输出敏感数据、localStorage 存储凭证、错误信息泄露
      - 认证: 弱比较（==）验证身份
      - CSRF: POST 表单缺少 CSRF Token
      - 加密: 弱哈希算法（MD5/SHA-1）、Math.random() 生成安全值
      - 配置: CORS 通配符、HTTP 明文传输、不安全正则（ReDoS）
      - 访问控制: 未验证的重定向、调试模式硬编码
      - 依赖: 原型链污染、postMessage 无 origin 验证
      - 供应链: 依赖版本未锁定（*/latest/next）
    - 每条规则含 CWE 编号 + OWASP Top 10 分类 + 修复建议 + 代码示例
    - `SecurityPanel.tsx` — 完整的安全扫描面板 UI:
      - 0-100 风险评分（低=安全，高=危险）
      - 按 severity(critical/high/medium/low/info) 过滤
      - 按类别分布筛选（10个安全类别图标化）
      - 按文件分组展示 + CWE/OWASP 标签
      - 代码示例折叠（不安全/安全写法对比）
      - 自动修复 + AI 修复按钮（通过 useAIFixStore 接入 LLM）
      - 严重/高危 banner 警告
    - `SecurityScanner.test.ts` — 完整测试覆盖全部 22 条规则
    - **集成**: PanelManager 新增 `"security"` PanelId；PanelQuickAccess 新增快捷入口；IDEPage renderPanel 已注册

14. **PerformanceOptimizer 单元测试** (测试覆盖)
    - `PerformanceOptimizer.test.ts` — 完整测试覆盖全部 18 条规则
    - 每条规则至少 2 个测试用例（触发 + 不触发）
    - 覆盖: analyzeFilePerformance / analyzeProjectPerformance / getPerfRuleDescriptions
    - 验证: impact 排序、评分体系、类别完整性（8 类全覆盖）、边界情况、性能测试

15. **智能测试用例生成** (Wave 2 - F2.5)
    - `TestGenerator.ts` — 代码分析 + 测试用例自动生成引擎:
      - `extractSymbols()` — 从 TS/TSX 源码提取可测符号（函数/组件/Hook/类/常量），识别导出状态、参数列表、返回类型、JSDoc、函数体
      - 函数测试: 快乐路径、空参数、返回类型验证、错误处理(throw/catch)、边界值(数值参数)、异步行为(Promise)、分支覆盖提示
      - 组件测试: 渲染测试、快照匹配、props 变体、事件处理(onClick/onChange/onSubmit)、条件渲染、加载状态
      - Hook 测试: 返回结构验证、状态更新(useState)、effect 清理(useEffect)、重渲染稳定性
      - 类/常量测试: 实例化验证、非空验证
      - `generateTestSuite()` — 为单文件生成完整测试套件（含 import、describe/it 分组、priority 排序）
      - `generateProjectTestPlan()` — 为整个项目生成测试计划（跳过已有测试文件/非代码文件）
      - `getSymbolStats()` — 符号统计（函数/组件/Hook/类/常量/导出/总数）
    - `TestGeneratorPanel.tsx` — 完整的测试生成面板 UI:
      - 按文件分组展示，每文件显示符号数和关键测试数
      - 6 种测试类别过滤（单元/组件/Hook/集成/边界/错误）
      - 4 级优先级标签（关键/高/中/低）
      - 代码折叠展示生成的测试代码 + 复制按钮
      - 一键"创建测试文件"按钮（写入 FileStore 并跳转）
      - 复制完整测试套件代码
    - `TestGenerator.test.ts` — 完整测试覆盖
      - extractSymbols: 函数/箭头函数/异步/组件/Hook/常量/类/JSDoc/注释跳过
      - generateTestSuite: 各类型测试生成、priority 排序、唯一 ID、测试文件路径、完整代码
      - generateProjectTestPlan: 多文件、跳过测试文件、空项目
      - getSymbolStats: 各类型统计
    - **集成**: PanelManager 新增 `"test-gen"` PanelId；PanelQuickAccess 新增快捷入口；IDEPage renderPanel 已注册

16. **代码质量仪表盘** (统一概览)
    - `CodeQualityDashboard.tsx` — 聚合诊断/性能/安全/测试四个维度的统一面板:
      - 综合质量评分（A-F 等级 + 0-100 分）+ 趋势变化指示
      - 2x2 维度卡片（诊断/性能/安全/测试），每张显示独立评分 + 关键统计
      - 点击维度卡片自动拆分打开对应子面板
      - "优先处理"区域聚合所有 error/critical/high 级别问题
      - 快速操作按钮组（一键跳转各子面板）
    - **集成**: PanelManager 新增 `"quality"` PanelId；PanelQuickAccess 新增快捷入口；IDEPage renderPanel 已注册

### 🔲 已全部完成 Wave 2 AI 智能化功能 (F2.1-F2.5)

### ✅ Wave 3 多联式智能编程功能增强 (进行中)

17. **全局命令面板 (Command Palette)** (Wave 3 - F3.1)
    - `CommandPalette.tsx` — 全局命令面板组件:
      - Ctrl+Shift+P 快捷键打开
      - 支持 18 个面板快速打开命令
      - 支持布局切换命令（标准三栏、AI 工作台、重置布局）
      - 支持视图切换命令（预览、代码、默认）
      - 支持操作命令（全局搜索、切换终端）
      - 支持导航命令（返回首页）
      - 模糊搜索（支持中文关键词和拼音首字母）
      - 按类别分组展示（面板、布局、操作、导航、视图）
      - 键盘导航（↑↓ 选择、Enter 执行、Esc 关闭）
      - 实时过滤结果计数
    - **集成**: IDEPage 新 `commandPaletteOpen` 状态和 Ctrl+Shift+P 快捷键监听；ViewSwitcher 新增命令面板按钮

18. **面板布局小地图 (Panel Minimap)** (Wave 3 - F3.2)
    - `PanelMinimap.tsx` — 实时可视化布局缩略图组件:
      - 递归渲染当前布局树结构为彩色色块
      - 18 个面板各有独立颜色标识
      - 点击面板色块可聚焦/打开对应面板
      - 面板图例展示当前可见面板列表
      - 面板数量统计
    - **集成**: IDEPage ViewSwitcher 插槽新增 PanelMinimap 控件

19. **快捷键帮助面板** (Wave 3 - F3.3)
    - `KeyboardShortcutsHelp.tsx` — 快捷键参考面板:
      - Ctrl+/ 快捷键打开
      - 按类别分组展示（命令、视图切换、终端、编辑器、面板操作、导航）
      - 20+ 个快捷键条目
      - 搜索过滤功能
      - 每个快捷键显示按键组合 + 功能描述
    - **集成**: IDEPage 新增 `shortcutsHelpOpen` 状态和 Ctrl+/ 快捷键监听；ViewSwitcher 新增键盘快捷键帮助按钮

20. **面板交换与替换 API** (Wave 3 - F3.4)
    - `PanelManager.tsx` — 新增 `swapPanels` 和 `replacePanel` 方法:
      - `swapPanels(nodeIdA, nodeIdB)` — 交换两个面板的内容，保持布局结构不变
      - `replacePanel(nodeId, newPanelId)` — 替换指定面板的内容为新面板
      - PanelManagerContext 接口更新，setLayout 支持数式更新
    - **集成**: PanelManager Context 已暴露 swapPanels/replacePanel，可被 CommandPalette 和 PanelMinimap 调用

21. **ViewSwitcher 增强** (Wave 3 - F3.5)
    - `ViewSwitcher.tsx` — 新增命令面板按钮 (Command 图标) 和快捷键帮助按钮 (Keyboard 图标):
      - Props 新增 `onCommandPalette` 和 `onShortcutsHelp` 回调
      - 工具栏图标按钮带 Tooltip 提示快捷键
    - **集成**: IDEPage 传递回调，连接命令面板和快捷键帮助的打开/关闭

22. **浮动面板窗口系统** (Wave 3 - F3.6)
    - `useFloatingPanelStore.ts` — Zustand Store 管理浮动面板:
      - 将面板从布局中分离为独立浮动窗口
      - 自由拖拽位置、调整大小、最小化/还原
      - Z-index 管理，保证焦点面板在最上层
    - `FloatingPanelContainer.tsx` — 浮动面板渲染容器
    - **集成**: IDEPage 底部渲染 FloatingPanelContainer；PanelManager 面板头部新增"浮动"按钮 (ExternalLink 图标)

23. **面板固定/锁定系统** (Wave 3 - F3.7)
    - `usePanelPinStore.ts` — Zustand Store 管理面板固定和锁定:
      - Pinned: 防止拖拽移动/关闭/调整大小
      - Locked: 防止面板内容类型被替换 (replacePanel blocked)
      - 持久化到 localStorage
    - **集成**: PanelManager 面板头部新增 Pin/Lock 图标按钮

24. **面板标签页分组** (Wave 3 - F3.8)
    - `usePanelTabGroupStore.ts` — Zustand Store 管理面板分组:
      - 将面板标签页归类到命名分组中
      - 分组折叠/展开、颜色标识
      - 持久化到 localStorage (zustand/middleware/persist + immer)
    - `TabGroupBar.tsx` — 分组管理工具栏
    - **集成**: IDEPage ViewSwitcher 插槽新增 TabGroupBar 控件

25. **代码审查与导入验证** (Wave 3 - 质量保障)
    - 系统性检查全部核心文件的导入导出一致性
    - 验证 `LLMService.ts` 全部导出 (8 个函数/类型) 与消费者匹配
    - 验证 `ai/` 目录 9 个模块的导出函数/类型均被正确引用
    - 验证 `stores/` 目录 8 个 Store 的导出与 `stores/index.ts` Hub 匹配
    - 验证 `constants/` 目录 3 个文件的导出与消费者匹配
    - 验证 `hooks/` 目录 2 个 Hook 的导出与 3 个消费页面匹配
    - 验证 `adapters/` 目录 2 个模块的导出与 FileStore/TopBar 匹配
    - 结论: **未发现导入缺失或导出不匹配问题**

26. **HomePage isCyber 全量迁移** (标准化 - Round 4)
    - 新增 `HomeTokens` token 接口（26 个字段）覆盖:
      - 聊天框: chatBoxBg, actionsBorder, actionBtnHover, actionIcon, actionLabel, actionShortcut
      - 输入区: plusBtn, plusIcon, textareaText, submitBtn
      - 实时意图: liveIntentBorder, liveIntentIcon, liveIntentText, liveIntentConfidence, designerBadge, aiBadge
      - 功能按钮: featureText, newProjectBtn, codingBtn, aiChatBtn
      - 上下文/对话框: ctxMenuNormal, ctxMenuDanger, renameDialogBg, renameConfirmBtn
      - 导航/视觉: navDot, cyberGlitchClass
    - 新增 `IntentToastTokens` token 接口（17 个字段）覆盖:
      - containerBg, designerIconBg, aiIconBg, designerIconColor, aiIconColor
      - summaryText, categoryText, closeText, progressBg
      - designerProgressGradient, aiProgressGradient, percentageText
      - lightbulbColor, suggestionText, bottomBorder, bottomText, loaderColor
    - **迁移结果**: HomePage.tsx `isCyber` 从 ~46 降至 **0**
    - **清理**: 移除 `useTheme` 导入和 `isCyber` 解构
    - **集成**: ThemeTokens 接口新增 `home: HomeTokens` + `intentToast: IntentToastTokens`

27. **ShareDialog isCyber 全量迁移** (标准化 - Round 5)
    - 新增 `ShareDialogTokens` token 接口（26 个字段）覆盖:
      - 对话框: dialogBg, headerBorder, headerIcon, titleText, subtitleText, closeBtn
      - 标签/表单: labelText, toggleActive, toggleInactive
      - 链接区: linkAreaBg, linkIcon, linkText, copyBtn
      - 邀请区: inviteInputArea, inviteInputIcon, inviteInputText, inviteBtn
      - 成员区: memberRowBg, memberRowHover, memberName, memberEmail, ownerBadge, roleBadge
      - 底部: footerBorder, qrBtn, doneBtn
    - **迁移结果**: ShareDialog.tsx `isCyber` 从 ~30 降至 **0**
    - **清理**: 移除 `useTheme` 导入，替换为 `useThemeTokens`
    - **集成**: ThemeTokens 接口新增 `shareDialog: ShareDialogTokens`
    - **测试**: `useThemeTokens.test.tsx` 新增 shareDialog 26 字段结构完整性测试 + Navy/Cyber 值验证

28. **图标资产查看器页面** (资源管理)
    - `IconAssetsPage.tsx` — 从 GitHub `YYC-Cube/YanYuCloud` 仓库拉取的全平台图标资产查看器:
      - 5 大平台分类（Web App / iOS / Android / macOS / watchOS）
      - 36 个图标资源完整展示，含尺寸/文件大小/用途标注
      - 透明棋盘背景图标预览
      - 每个图标支持复制链接/新标签打开/下载
      - 分类过滤 + 统计卡片
      - 平台集成使用指南（HTML/Android/iOS）
    - **数据源**: `YYC3-Design-Prompt/public/yyc3` 目录（via GitHub MCP API）
    - **集成**: 路由 `/icons`；HomePage 侧边栏新增"图标资产"导航项 (ImageIcon, emerald accent)
    - routes.ts 路由数从 7 增至 **8**

29. **ThemeSwitcher isCyber token 化迁移** (标准化 - Round 6)
    - 新增 `ThemeSwitcherTokens` token 接口（6 个字段）覆盖:
      - compactBtnHover, compactPaletteBtnHover, fullBtnStyle
      - glowDot, iconGlow, labelFont
    - **迁移结果**: ThemeSwitcher.tsx `isCyber` 从 ~8 降至 **~3**（仅保留图标选择/标签/title 等结构性判断）
    - **集成**: ThemeTokens 接口新增 `themeSwitcher: ThemeSwitcherTokens`

30. **Design Prompt 对齐写入** (架构对齐 - 变量词库 + P0/P1/P2/P3)
    - 对齐来源: `YYC3-Design-Prompt/变量词库/` + `P0-核心架构/` + `P1-核心功能/` + `P2-高级功能/` + `P3-优化完善/`
    - 新增 `constants/brand.ts` — 品牌标识常量（60+ 变量，含品牌名称/标语/颜色/联系方式/断点/动画/z-index 分层）
    - 新增 `constants/config.ts` — 应用配置参数（60+ 变量，含服务器/数据库/编辑器/AI/性能/安全/UI/协作/终端/预览/项目配置）
    - 新增 `types/index.ts` — 核心类型定义（DesignRoot/PanelSpec/ComponentSpec/StyleSpec/AIMessage/FileNode/PluginManifest/CollabUser/EncryptedData/I18n 等 30+ 接口）
    - 新增 `adapters/TauriBridge.ts` — Tauri 宿主机桥接桩（文件系统/剪贴板/通知/Shell/窗口 API，Web 自动降级）
    - 新增 `PluginSystem.ts` — 插件系统架构（注册/生命周期/沙箱 API/事件通信/4 个内置插件模板）
    - 新增 `stores/usePreviewHistoryStore.ts` — 预览历史 Store（快照创建/删除/标记/回滚/Diff 对比/自动清理）
    - 新增 `i18n/index.ts` — 国际化系统（zh-CN/en-US/ja-JP 三语，Zustand 驱动，dot notation 翻译查找，插值支持）
    - 新增 `CryptoService.ts` — 加密服务（AES-GCM-256/PBKDF2 密钥派生/安全存储/数据脱敏/SHA-256 哈希）
    - `constants/index.ts` 更新：新增 brand + config 导出
    - `stores/index.ts` 更新：新增 usePreviewHistoryStore 导出（PreviewHistorySnapshot 别名避免冲突）
    - **对齐覆盖率**: 32/36 项对齐完成（4 项因环境限制或后端专属跳过）

---

## 📋 阶段性实施总结 (截至 2026-03-14)

### 总体进度

| Wave | 功能范围 | 状态 | 已完成特性 |
|------|---------|------|-----------|
| **Wave 1** | 基础功能 (F1.1–F1.3) | ✅ 已完成 | IndexedDB 持久化、Sandpack 预览、终端命令系统、项目导出 |
| **Wave 2** | AI 智能化 (F2.1–F2.5) | ✅ 已完成 | AI 流水线、错误分析、性能优化、安全扫描、测试生成、质量仪表盘 |
| **Wave 3** | 多联式增强 (F3.1–F3.8) | 🔄 进行中 | 命令面板、小地图、快捷键帮助、面板交换/替换、浮动面板、固定/锁定、标签分组 |
| **标准化** | 代码规范/主题迁移 | 🔄 进行中 | 5 轮标准化审计完成，isCyber 从 ~133 降至 ~16 (HomePage+ShareDialog 清零) |

### 文件资产清单

#### 核心目录结构

```
/src/app/
├── App.tsx                          # 应用根组件 (Router + Theme + ErrorBoundary)
├── routes.ts                        # 路由配置 (7 条路由, 懒加载)
├── components/
│   ├── HomePage.tsx                 # 首页 (品牌/聊天/项目/路由决策)
│   ├── IDEPage.tsx                  # IDE 主页面 (三栏/18 面板/DnD)
│   ├── AIChatPage.tsx               # AI 对话工作台
│   ├─ SettingsPage.tsx             # 全局设置页
│   ├── TemplatesPage.tsx            # 模板中心
│   ├── DocsPage.tsx                 # 文档中心
│   ├── NotFoundPage.tsx             # 404 页面
│   ├── ProjectCreateWizard.tsx      # 项目创建向导
│   ├── ErrorBoundary.tsx            # 全局错误边界
│   └── ide/
│       ├── ThemeStore.tsx           # 主题 Context Provider
│       ├── CustomThemeStore.ts      # 自定义主题引擎 (OKLch/6预设)
│       ├── ThemeCustomizer.tsx      # 主题编辑器 UI
│       ├── ThemeSwitcher.tsx        # 主题切换按钮
│       ├── FileStore.tsx            # 文件系统 Context Provider
│       ├── ModelRegistry.tsx        # 模型注册中心 Context Provider
│       ├── LLMService.ts            # LLM API 调用层 (6大Provider/SSE)
│       ├── WorkflowEventBus.tsx     # 跨面板事件总线
│       ├── PanelManager.tsx         # 多联式布局引擎 (拖拽/拆分/合并)
│       ├── LeftPanel.tsx            # AI 对话面板
│       ├── CenterPanel.tsx          # 文件管理面板
│       ├── RightPanel.tsx           # 代码编辑面板
│       ├── TopBar.tsx               # 顶部导航栏
│       ├── ViewSwitcher.tsx         # 视图切换栏
│       ├── Terminal.tsx             # 集成终端
│       ├── MonacoWrapper.tsx        # Monaco Editor 封装
│       ├── TabBar.tsx               # 标签页栏
│       ├── GitPanel.tsx             # Git 集成面板
│       ├── AgentOrchestrator.tsx    # Agent 编排面板
│       ├── AgentMarket.tsx          # Agent 市场面板
│       ├── KnowledgeBase.tsx        # 知识库面板
│       ├── RAGChat.tsx              # RAG 增强对话面板
│       ├── CollabPanel.tsx          # 协同编辑面板
│       ├── OpsPanel.tsx             # 运维面板
│       ├── WorkflowPipeline.tsx     # 工作流流水线面板
│       ├── RealtimePreviewPanel.tsx # 实时预览面板
│       ├── SandpackPreview.tsx      # Sandpack 沙箱预览
│       ├── ErrorDiagnosticsPanel.tsx # 错误诊断面板
│       ├── PerformancePanel.tsx     # 性能优化面板
│       ├── SecurityPanel.tsx        # 安全扫描面板
│       ├── TestGeneratorPanel.tsx   # 测试生成面板
│       ├── CodeQualityDashboard.tsx # 代码质量仪表盘
│       ├── DiffPreviewModal.tsx     # Diff 预览模态
│       ├── CommandPalette.tsx       # 全局命令面板
│       ├── PanelMinimap.tsx         # 布局小地图
│       ├── PanelQuickAccess.tsx     # 面板快速访问
│       ├── KeyboardShortcutsHelp.tsx # 快捷键帮助
│       ├── FloatingPanelContainer.tsx # 浮动面板容器
│       ├── TabGroupBar.tsx          # 标签分组栏
│       ├── LayoutPresets.tsx        # 布局预设切换
│       ├── LoadingSpinner.tsx       # 统一加载指示器
│       ├── APIKeySettingsUI.tsx     # API 密钥设置 UI
│       ├── ModelSettings.tsx        # 模型设置面板
│       ├── NotificationDrawer.tsx   # 通知抽屉
│       ├── ShareDialog.tsx          # 分享对话框
│       ├── SnapshotDiffModal.tsx    # 快照 Diff 模态
│       ├── ChatHistoryStore.ts      # 会话历史管理
│       ├── PreviewEngine.ts         # 预览引擎
│       ├── ProxyService.ts          # 代理服务
│       ├── fileData.ts              # 示例文件数据
│       ├── ai/                      # AI 智能模块
│       │   ├── AIPipeline.ts        # 端到端代码生成流水线
│       │   ├── ContextCollector.ts  # 项目上下文收集
│       │   ├── SystemPromptBuilder.ts # 系统提示词构建
│       │   ├── CodeApplicator.ts    # 代码应用/Diff
│       │   ├── ErrorAnalyzer.ts     # 静态错误分析 (25+规则)
│       │   ├── PerformanceOptimizer.ts # 性能优化 (18规则)
│       │   ├── SecurityScanner.ts   # 安全扫描 (22规则)
│       │   ├── TestGenerator.ts     # 测试用例生成
│       │   └── CommandRegistry.ts   # 终端命令注册表
│       ├── stores/                  # Zustand Store Hub
│       │   ├── index.ts             # 统一导出
│       │   ├── useFileStoreZustand.ts
│       │   ├── useModelStoreZustand.ts
│       │   ├── useProxyStoreZustand.ts
│       │   ├── useAIFixStore.ts     # 跨面板 AI 修复通道
│       │   ├── usePreviewStore.ts
│       │   ├── useScrollSyncStore.ts
│       │   ├── usePanelTabGroupStore.ts
│       │   ├── usePanelPinStore.ts
│       │   └── useFloatingPanelStore.ts
│       ├── hooks/                   # 自定义 Hooks
│       │   ├── useErrorDiagnostics.ts
│       │   └── useThemeTokens.ts    # 主题 token 系统
│       ├── adapters/                # 外部适配器
│       │   ├── IndexedDBAdapter.ts  # IndexedDB 持久化
│       │   └── ProjectExporter.ts   # ZIP/JSON 导出
│       └── constants/               # 共享常量
│           ├── index.ts             # 统一导出
│           ├── storage-keys.ts      # localStorage 键管理
│           └── providers.ts         # Provider 元数据
```

### Provider 嵌套层级 (架构约束)

```
DndProvider (react-dnd)
  └─ WorkflowEventBusProvider
      └─ FileStoreProvider
          └─ ModelRegistryProvider
              └─ PanelManagerProvider
                  └─ IDE 内容 (TopBar, ViewSwitcher, PanelLayoutArea, Terminal...)
```

### 面板注册表 (18 个功能面板)

| PanelId | 组件 | 功能描述 |
|---------|------|---------|
| `ai` | LeftPanel | AI 对话 + LLM 流式调用 |
| `files` | CenterPanel | 文件树 + Monaco 编辑器 |
| `code` | RightPanel | 代码详情 + 格式化 |
| `git` | GitPanel | Git 版本控制 |
| `agents` | AgentOrchestrator | Agent 编排 |
| `market` | AgentMarket | Agent 市场 |
| `knowledge` | KnowledgeBase | 知识库 |
| `rag` | RAGChat | RAG 增强对话 |
| `collab` | CollabPanel | 协同编辑 |
| `ops` | OpsPanel | 运维监控 |
| `workflow` | WorkflowPipeline | 工作流流水线 |
| `preview` | RealtimePreviewPanel | 实时预览 |
| `diagnostics` | ErrorDiagnosticsPanel | 错误诊断 |
| `performance` | PerformancePanel | 性能优化 |
| `security` | SecurityPanel | 安全扫描 |
| `test-gen` | TestGeneratorPanel | 测试生成 |
| `quality` | CodeQualityDashboard | 质量仪表盘 |
| `terminal` | Terminal | 集成终端 |

### 关键技术指标

| 指标 | 数值 |
|------|------|
| 总文件数 | 60+ (.tsx/.ts) |
| AI 分析规则总数 | 65+ (25 错误 + 18 性能 + 22 安全) |
| LLM Provider 支持数 | 6 (Ollama/OpenAI/智谱/通义/DeepSeek/自定义) |
| 终端内置命令数 | 23 (19 文件系统 + 4 模拟) |
| Zustand Store 数 | 8 |
| 路由数 | 7 (含 404 catch-all) |
| 事件总线事件类型 | 50+ |
| 快捷键 | 20+ |
| 布局预设 | 3+ (designer/ai-workspace/default) |
| 测试用例 | 210+ assertions (含 home/intentToast/shareDialog token 测试) |

### isCyber 标准化审计状态 (Round 5 完成)

| 文件 | isCyber 数量 | 状态 | 备注 |
|------|-------------|------|------|
| **HomePage.tsx** | **0** | ✅ 全清 | Round 4 完成，43 个 token 化 |
| **ShareDialog.tsx** | **0** | ✅ 全清 | Round 5 完成，26 个 token 化 |
| **ThemeStore.tsx** | 3 | ✅ 保留 | 定义层，必须保留 |
| **MonacoWrapper.tsx** | 5 | ✅ 保留 | Monaco API 层，必须保留 |
| **ThemeSwitcher.tsx** | ~3 | ✅ 已迁移 | Round 6 完成，6 个样式 token 化 (compactBtnHover/compactPaletteBtnHover/fullBtnStyle/glowDot/iconGlow/labelFont)，仅保留 ~3 个结构性 isCyber (图标选择/标签/title 提示) |

### 待验证事项

- [ ] `tsc --noEmit` 编译验证（需在真实终端执行）
- [ ] `vitest run` 测试验证（需在真实终端执行）
- [x] `useThemeTokens.test.tsx` 补充 `home` 和 `intentToast` token 组的结构完整性测试 ✅
- [x] `useThemeTokens.test.tsx` 补充 `shareDialog` token 组的结构完整性测试 ✅
- [x] `useThemeTokens.test.tsx` 新增字段总数断言（home=26, intentToast=17, shareDialog=26, text=10, status=8, gradients=6）✅
- [x] `useThemeTokens.test.tsx` 新增 Cyberpunk 主题结构完整性验证（home/intentToast/shareDialog/text/status/gradients）✅
- [x] `useThemeTokens.test.tsx` 新增 Navy/Cyber 键集合一致性验证（11 个 token 组跨主题 key set 断言）✅
- [ ] `useThemeTokens.test.tsx` 新增 `themeSwitcher` token 组测试（6 字段）

### 新增功能

28. **图标资产查看器页面** (资源管理)
    - `IconAssetsPage.tsx` — 从 GitHub `YYC-Cube/YanYuCloud` 仓库拉取的全平台图标资产查看器:
      - 5 大平台分类（Web App / iOS / Android / macOS / watchOS）
      - 36 个图标资源完整展示，含尺寸/文件大小/用途标注
      - 透明棋盘背景图标预览
      - 每个图标支持复制链接/新标签打开/下载
      - 分类过滤 + 统计卡片
      - 平台集成使用指南（HTML/Android/iOS）
    - **数据源**: `YYC3-Design-Prompt/public/yyc3` 目录（via GitHub MCP API）
    - **集成**: 路由 `/icons`；HomePage 侧边栏新增"图标资产"导航项 (ImageIcon, emerald accent)
    - routes.ts 路由数从 7 增至 **8**

29. **ThemeSwitcher isCyber token 化迁移** (标准化 - Round 6)
    - 新增 `ThemeSwitcherTokens` token 接口（6 个字段）覆盖:
      - compactBtnHover, compactPaletteBtnHover, fullBtnStyle
      - glowDot, iconGlow, labelFont
    - **迁移结果**: ThemeSwitcher.tsx `isCyber` 从 ~8 降至 **~3**（仅保留图标选择/标签/title 等结构性判断）
    - **集成**: ThemeTokens 接口新增 `themeSwitcher: ThemeSwitcherTokens`

30. **Design Prompt 对齐写入** (架构对齐 - 变量词库 + P0/P1/P2/P3)
    - 对齐来源: `YYC3-Design-Prompt/变量词库/` + `P0-核心架构/` + `P1-核心功能/` + `P2-高级功能/` + `P3-优化完善/`
    - 新增 `constants/brand.ts` — 品牌标识常量（60+ 变量，含品牌名称/标语/颜色/联系方式/断点/动画/z-index 分层）
    - 新增 `constants/config.ts` — 应用配置参数（60+ 变量，含服务器/数据库/编辑器/AI/性能/安全/UI/协作/终端/预览/项目配置）
    - 新增 `types/index.ts` — 核心类型定义（DesignRoot/PanelSpec/ComponentSpec/StyleSpec/AIMessage/FileNode/PluginManifest/CollabUser/EncryptedData/I18n 等 30+ 接口）
    - 新增 `adapters/TauriBridge.ts` — Tauri 宿主机桥接桩（文件系统/剪贴板/通知/Shell/窗口 API，Web 自动降级）
    - 新增 `PluginSystem.ts` — 插件系统架构（注册/生命周期/沙箱 API/事件通信/4 个内置插件模板）
    - 新增 `stores/usePreviewHistoryStore.ts` — 预览历史 Store（快照创建/删除/标记/回滚/Diff 对比/自动清理）
    - 新增 `i18n/index.ts` — 国际化系统（zh-CN/en-US/ja-JP 三语，Zustand 驱动，dot notation 翻译查找，插值支持）
    - 新增 `CryptoService.ts` — 加密服务（AES-GCM-256/PBKDF2 密钥派生/安全存储/数据脱敏/SHA-256 哈希）
    - `constants/index.ts` 更新：新增 brand + config 导出
    - `stores/index.ts` 更新：新增 usePreviewHistoryStore 导出（PreviewHistorySnapshot 别名避免冲突）
    - **对齐覆盖率**: 32/36 项对齐完成（4 项因环境限制或后端专属跳过）

### 下阶段建议

1. **Wave 4 规划** — P2-文档编辑器（富文本/Markdown 编辑器）为主要待做项
2. **React Query 深度集成** — P1-服务端状态管理可在有真实 API 后集成
3. **质量保障** — 在真实终端执行 `tsc --noEmit` + `vitest run` 验证
4. **图标集成** — 将 Web App 图标从 GitHub CDN 集成为项目实际 favicon/PWA 图标
5. **P5-审核交付** — 按全量收尾提示词 12 大分类逐项验收