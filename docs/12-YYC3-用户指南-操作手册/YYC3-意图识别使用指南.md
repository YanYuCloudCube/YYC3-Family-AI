# 意图识别使用指南

> **版本**: v1.0.0  
> **适用对象**: AI 应用开发者  
> **最后更新**: 2026-03-31

## 概述

本指南将帮助你使用 YYC3 Family AI 的意图识别功能，构建智能的 AI 应用。

## 快速开始

### 1. 基本使用

```typescript
import { IntentRecognizer } from '@/app/components/ide/llm/IntentRecognizer';

const recognizer = new IntentRecognizer();

// 识别用户意图
const result = await recognizer.recognize('帮我创建一个 React 组件');

console.log('意图:', result.intent);
console.log('置信度:', result.confidence);
console.log('实体:', result.entities);
```

### 2. 注册自定义意图

```typescript
// 注册自定义意图
recognizer.registerIntent({
  name: 'create-component',
  displayName: '创建组件',
  description: '创建一个新的 React 组件',
  patterns: [
    '创建{componentName}组件',
    '帮我写一个{componentName}组件',
    '生成{componentName}组件',
  ],
  entities: [
    {
      name: 'componentName',
      type: 'string',
      required: true,
    },
  ],
});
```

### 3. 提取实体

```typescript
const result = await recognizer.recognize('创建 Button 组件');

console.log('组件名称:', result.entities.componentName);
// 输出: Button
```

## 意图类型

### 1. 代码生成意图

```typescript
const codeGenIntent = {
  name: 'code-generation',
  displayName: '代码生成',
  patterns: [
    '生成{codeType}代码',
    '帮我写{codeType}',
    '创建{codeType}',
  ],
  entities: [
    { name: 'codeType', type: 'enum', values: ['组件', '函数', '类', '模块'] },
  ],
};
```

### 2. 文件操作意图

```typescript
const fileOpIntent = {
  name: 'file-operation',
  displayName: '文件操作',
  patterns: [
    '打开{fileName}',
    '保存{fileName}',
    '删除{fileName}',
  ],
  entities: [
    { name: 'fileName', type: 'string' },
  ],
};
```

### 3. 问题查询意图

```typescript
const queryIntent = {
  name: 'query',
  displayName: '问题查询',
  patterns: [
    '什么是{topic}',
    '如何{action}',
    '为什么{question}',
  ],
  entities: [
    { name: 'topic', type: 'string' },
    { name: 'action', type: 'string' },
    { name: 'question', type: 'string' },
  ],
};
```

## 高级功能

### 1. 多意图识别

```typescript
// 识别多个意图
const results = await recognizer.recognizeMultiple(
  '创建 Button 组件并添加到项目中'
);

console.log('意图数量:', results.length);
// 输出: 2 (创建组件 + 添加到项目)
```

### 2. 上下文感知

```typescript
// 设置上下文
recognizer.setContext({
  currentFile: 'App.tsx',
  selectedCode: 'function Hello() { return <div>Hello</div> }',
});

// 基于上下文识别
const result = await recognizer.recognize('优化这段代码');
```

### 3. 意图链

```typescript
// 定义意图链
const intentChain = recognizer.createChain([
  { intent: 'analyze-code', order: 1 },
  { intent: 'optimize-code', order: 2 },
  { intent: 'test-code', order: 3 },
]);

// 执行意图链
const chainResult = await intentChain.execute('优化并测试代码');
```

## 实体提取

### 1. 基本实体

```typescript
const result = await recognizer.recognize('创建名为 Button 的组件');

console.log('实体:', result.entities);
// {
//   componentName: 'Button',
// }
```

### 2. 复合实体

```typescript
const result = await recognizer.recognize(
  '创建一个 React 函数组件，名为 Button，包含 onClick 事件'
);

console.log('实体:', result.entities);
// {
//   componentType: 'function',
//   componentName: 'Button',
//   features: ['onClick'],
// }
```

### 3. 动态实体

```typescript
// 从数据库加载实体
recognizer.registerDynamicEntity({
  name: 'fileName',
  loader: async () => {
    const files = await fileSystem.listFiles();
    return files.map(f => f.name);
  },
  refreshInterval: 60000, // 每分钟刷新
});
```

## 置信度与模糊匹配

### 1. 置信度阈值

```typescript
// 设置置信度阈值
recognizer.setConfidenceThreshold(0.7);

const result = await recognizer.recognize('可能是代码生成的请求');

if (result.confidence < 0.7) {
  console.log('置信度过低，需要确认');
}
```

### 2. 模糊匹配

```typescript
// 启用模糊匹配
recognizer.enableFuzzyMatching(true);

const result = await recognizer.recognize('创建一个Buttn组件');
// 即使拼写错误，也能识别为 Button

console.log('修正后的实体:', result.entities.componentName);
// 输出: Button
```

### 3. 歧义消解

```typescript
// 处理歧义
const result = await recognizer.recognize('创建组件');

if (result.ambiguous) {
  // 返回可能的意图列表
  console.log('可能的意图:', result.candidates);
  
  // 用户选择
  const selected = result.candidates[0];
  console.log('用户选择:', selected);
}
```

## 训练与优化

### 1. 添加训练数据

```typescript
// 添加训练样本
recognizer.addTrainingData({
  intent: 'create-component',
  samples: [
    '创建一个 Button 组件',
    '帮我写个 Card 组件',
    '生成 Avatar 组件',
    '新建一个 Input 组件',
  ],
});
```

### 2. 评估模型

```typescript
// 评估模型性能
const evaluation = await recognizer.evaluate({
  testSet: [
    { input: '创建组件', expected: 'create-component' },
    { input: '打开文件', expected: 'file-operation' },
    // ...
  ],
});

console.log('准确率:', evaluation.accuracy);
console.log('召回率:', evaluation.recall);
console.log('F1 分数:', evaluation.f1Score);
```

### 3. 持续学习

```typescript
// 记录用户反馈
recognizer.recordFeedback({
  input: '创建组件',
  predicted: 'create-component',
  actual: 'create-component',
  correct: true,
});

// 定期重新训练
await recognizer.retrain();
```

## 集成示例

### 与 LLM 集成

```typescript
import { LLMProviderFactory } from '@/app/components/ide/llm/LLMProviderFactory';

async function processUserInput(input: string) {
  // 1. 识别意图
  const intentResult = await recognizer.recognize(input);
  
  // 2. 构建 LLM 提示词
  const llmProvider = LLMProviderFactory.createProvider({
    type: 'openai',
    apiKey: 'sk-...',
  });
  
  const prompt = buildPromptFromIntent(intentResult);
  
  // 3. 调用 LLM
  const response = await llmProvider.chat([
    { role: 'system', content: prompt },
    { role: 'user', content: input },
  ]);
  
  return response;
}
```

### 与代码编辑器集成

```typescript
// 在编辑器中使用意图识别
editor.onCommand(async (command) => {
  const intent = await recognizer.recognize(command);
  
  switch (intent.intent) {
    case 'create-component':
      const code = await generateComponent(intent.entities);
      editor.insert(code);
      break;
    
    case 'refactor-code':
      const selectedCode = editor.getSelection();
      const refactored = await refactorCode(selectedCode, intent.entities);
      editor.replace(refactored);
      break;
  }
});
```

## 最佳实践

### 1. 意图设计原则

- 意图名称清晰明确
- 模式简洁但不冗余
- 实体定义完整
- 置信度阈值合理

### 2. 性能优化

```typescript
// 缓存识别结果
recognizer.enableCache(true);

// 批量识别
const results = await recognizer.recognizeBatch([
  '创建组件',
  '打开文件',
  '保存代码',
]);
```

### 3. 错误处理

```typescript
try {
  const result = await recognizer.recognize(input);
  
  if (!result.intent) {
    // 无法识别意图
    console.log('抱歉，我无法理解您的请求');
  }
} catch (error) {
  console.error('意图识别失败:', error);
}
```

## 常见问题

### Q: 如何提高识别准确率?

1. 增加训练数据
2. 优化模式匹配规则
3. 使用更大的语言模型
4. 收集用户反馈并持续学习

### Q: 如何处理未知意图?

```typescript
const result = await recognizer.recognize(input);

if (result.intent === 'unknown') {
  // 返回默认处理
  return '抱歉，我不太明白您的意思，请详细描述您的需求';
}
```

### Q: 如何支持多语言?

```typescript
// 注册多语言模式
recognizer.registerIntent({
  name: 'create-component',
  patterns: {
    zh: ['创建{componentName}组件', '生成{componentName}组件'],
    en: ['Create {componentName} component', 'Generate {componentName}'],
  },
});

// 切换语言
recognizer.setLanguage('zh');
```

## 相关资源

- [LLM 服务 API 文档](../API文档/LLM服务API文档.md)
- [架构文档 - 意图识别](../架构文档/系统架构.md#意图识别)
- [NLP 最佳实践](./NLP最佳实践.md)

---

**维护者**: YYC3 团队  
**反馈渠道**: [GitHub Issues](https://github.com/YanYuCloudCube/YYC3-Family-AI/issues)
