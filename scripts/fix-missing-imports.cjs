#!/usr/bin/env node

/**
 * @file fix-missing-imports.cjs
 * @description 快速修复缺少 Logger import 的文件
 */

const fs = require('fs');
const path = require('path');

// 需要修复的文件列表 (从 typecheck 错误中提取)
const filesToFix = [
  'src/app/components/ide/adapters/TauriBridge.ts',
  'src/app/components/ide/CodeValidator.optimized.ts',
  'src/app/components/ide/LLMService.ts',
  'src/app/components/ide/MonacoWorkerManager.ts',
  'src/app/components/ide/preview/ScrollSyncEngine.ts',
  'src/app/components/ide/services/AIAgentWorkflow.ts',
  'src/app/components/ide/services/DatabaseConnector.ts',
  'src/app/components/ide/services/EncryptionService.ts',
  'src/app/components/ide/services/MCPClient.ts',
  'src/app/components/ide/services/NLCommandService.ts',
  'src/app/components/ide/services/PerformanceMonitor.ts',
  'src/app/components/ide/services/RateLimiter.ts',
  'src/app/components/ide/theme/CSSVariableInjector.ts',
];

const ROOT_DIR = process.cwd();
const IMPORT_STATEMENT = "import { logger } from './services/Logger';";

let fixedCount = 0;

filesToFix.forEach(relativePath => {
  const fullPath = path.join(ROOT_DIR, relativePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${relativePath}`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  
  // 检查是否已经有 Logger import
  if (content.includes("import { logger }") || content.includes("from './Logger'")) {
    console.log(`✅ 已有 import: ${relativePath}`);
    return;
  }
  
  // 检查是否使用了 logger
  if (!content.includes('logger.')) {
    console.log(`⏭️  未使用 logger: ${relativePath}`);
    return;
  }
  
  // 计算正确的相对路径到 Logger
  const targetDir = path.dirname(fullPath);
  const loggerFile = path.join(path.dirname(fullPath), '..', 'services', 'Logger.ts');
  let relativeImport = path.relative(targetDir, loggerFile).replace(/\.ts$/, '');
  
  if (!relativeImport.startsWith('.')) {
    relativeImport = './' + relativeImport;
  }
  
  const importLine = `import { logger } from "${relativeImport}";`;
  
  // 查找合适的插入位置 (在最后一个 /* ... */ 注释块之后)
  const lines = content.split('\n');
  let insertPosition = 0;
  
  for (let i = 0; i < Math.min(50, lines.length); i++) {
    const line = lines[i].trim();
    
    // 跳过空行和注释
    if (line === '' || line.startsWith('*') || line.startsWith('//') || line.startsWith('/**') || line.startsWith('/*')) {
      insertPosition = i + 1;
      continue;
    }
    
    // 遇到第一个非注释非空行，停止
    if (line && !line.startsWith('*') && !line.startsWith('/') && !line.startsWith('//')) {
      break;
    }
  }
  
  // 插入 import
  lines.splice(insertPosition, 0, importLine);
  fs.writeFileSync(fullPath, lines.join('\n'), 'utf-8');
  
  fixedCount++;
  console.log(`✅ 已修复: ${relativePath} (位置: L${insertPosition + 1})`);
});

console.log(`\n🎉 完成! 共修复 ${fixedCount} 个文件\n`);
