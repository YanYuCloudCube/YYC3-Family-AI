#!/usr/bin/env node

/**
 * @file scripts/cleanup-console.cjs
 * @description YYC³ Console 清理脚本 - 智能替换 console 为 Logger 服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-14
 * @license MIT
 *
 * 功能:
 * - 自动识别 TypeScript/TSX 文件中的 console 语句
 * - 智能替换为 Logger 服务调用 (logger.info/warn/error)
 * - 支持按文件类型、目录、优先级过滤
 * - 生成清理报告和统计信息
 * - 支持 dry-run 模式 (预览不修改)
 *
 * 用法:
 *   node scripts/cleanup-console.cjs [选项]
 *
 * 选项:
 *   --all              清理所有文件 (默认)
 *   --core             仅核心业务文件
 *   --plugins          仅插件系统文件
 *   --services         仅服务层文件
 *   --hooks            仅 React Hooks 文件
 *   --dry-run          预览模式 (不实际修改)
 *   --stats            仅显示统计信息
 *   --file <path>      处理指定文件
 *   --exclude <pattern> 排除匹配的文件
 *
 * 示例:
 *   node scripts/cleanup-console.cjs --core --dry-run
 *   node scripts/cleanup-console.cjs --services
 *   node scripts/cleanup-console.cjs --file src/app/components/ide/services/CloudSyncService.ts
 */

const fs = require('fs');
const path = require('path');

// 简单的 glob 实现 (避免依赖)
function globSync(patterns, options = {}) {
  const results = [];
  const { cwd = process.cwd(), ignore = [], absolute = false } = options;

  function scanDir(dir, pattern) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(cwd || dir, fullPath);

        // 检查是否应该忽略
        if (ignore.some(ig => {
          const ignorePath = path.resolve(cwd || '', ig);
          return fullPath.startsWith(ignorePath) || relativePath.match(ig.replace(/\*/g, '.*'));
        })) {
          continue;
        }

        if (entry.isDirectory()) {
          // 排除 node_modules 等
          if (!['node_modules', '.git', 'dist', 'coverage'].includes(entry.name)) {
            scanDir(fullPath, pattern);
          }
        } else if (entry.isFile()) {
          // 检查文件名是否匹配模式
          if (matchPattern(entry.name, pattern)) {
            results.push(absolute ? fullPath : relativePath);
          }
        }
      }
    } catch (e) {
      // 忽略无权限目录
    }
  }

  patterns.forEach(pattern => {
    const basePattern = pattern.includes('/') ? pattern.split('/').pop() : pattern;
    const searchDir = cwd || SRC_DIR;

    if (pattern.includes('**') || pattern.includes('*')) {
      scanDir(searchDir, basePattern);
    } else {
      const fullPath = path.join(searchDir, pattern);
      if (fs.existsSync(fullPath)) {
        results.push(absolute ? fullPath : pattern);
      }
    }
  });

  return [...new Set(results)]; // 去重
}

// 简单的模式匹配
function matchPattern(filename, pattern) {
  if (!pattern) return true;

  // 转换 glob 为正则
  const regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace('?', '.');

  return new RegExp(`^${regexStr}$`).test(filename);
}

// ── 配置常量 ──
const SRC_DIR = path.join(__dirname, '..', 'src', 'app', 'components', 'ide');

// 文件分类规则
const FILE_CATEGORIES = {
  core: {
    description: '核心业务文件',
    patterns: [
      '**/PluginSystem.ts',
      '**/CloudSyncService.ts',
      '**/SnapshotManager.ts',
      '**/SnapshotService.ts',
      '**/PreviewEngine.ts',
      '**/PreviewModeController.ts',
      '**/CryptoService.ts',
      '**/StorageMonitor.ts',
      '**/DataImporter.ts',
      '**/MCPResources.ts',
      '**/VersioningService.ts',
      '**/StorageCleanup.ts',
      '**/AIAgentWorkflow.ts',
      '**/BoundaryHandler.ts',
      '**/EncryptionService.ts',
      '**/DatabaseConnector.ts',
      '**/snapshotApplyHelper.ts',
      '**/MonacoWorkerManager.ts',
    ],
  },
  services: {
    description: '服务层文件',
    patterns: [
      '**/services/*.ts',
      '!**/services/Logger.ts', // 排除 Logger 本身
      '!**/services/Sanitizer.ts',
    ],
  },
  plugins: {
    description: '插件系统文件',
    patterns: [
      '**/plugins/*.ts',
      '**/llm/Plugin*.ts',
    ],
  },
  hooks: {
    description: 'React Hooks 文件',
    patterns: [
      '**/hooks/use*.ts',
      '**/hooks/use*.tsx',
    ],
  },
  terminal: {
    description: '终端相关文件',
    patterns: [
      '**/api/terminal*.ts',
      '**/Terminal*.tsx',
      '**/XTerminal.tsx',
      '**/hooks/useTerminal*.ts',
    ],
  },
};

// 默认排除的文件/目录
const DEFAULT_EXCLUDES = [
  '**/__tests__/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.optimized.ts', // 旧版本文件
  '**/*.spec.ts',
  '**/testing/*TestSuite.ts', // 测试套件
  '**/testing/performanceBenchmark.ts', // 性能基准
];

// ── 工具函数 ──

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    categories: ['all'],
    dryRun: false,
    statsOnly: false,
    filePath: null,
    excludePatterns: [...DEFAULT_EXCLUDES],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--all':
        options.categories = ['all'];
        break;
      case '--core':
        options.categories.push('core');
        break;
      case '--services':
        options.categories.push('services');
        break;
      case '--plugins':
        options.categories.push('plugins');
        break;
      case '--hooks':
        options.categories.push('hooks');
        break;
      case '--terminal':
        options.categories.push('terminal');
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--stats':
        options.statsOnly = true;
        break;
      case '--file':
        options.filePath = args[++i];
        break;
      case '--exclude':
        options.excludePatterns.push(args[++i]);
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`❌ 未知选项: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

/**
 * 获取要处理的文件列表
 */
function getFiles(options) {
  // 如果指定了单个文件
  if (options.filePath) {
    const absolutePath = path.resolve(options.filePath);
    if (fs.existsSync(absolutePath)) {
      return [absolutePath];
    }
    console.error(`❌ 文件不存在: ${absolutePath}`);
    process.exit(1);
  }

  let files = [];
  const processedPaths = new Set();

  // 根据类别收集文件
  for (const category of options.categories) {
    if (category === 'all') {
      // 处理所有 .ts/.tsx 文件
      const allPatterns = [
        '**/*.ts',
        '**/*.tsx',
        ...options.excludePatterns,
      ];
      const result = globSync(allPatterns, {
        cwd: SRC_DIR,
        absolute: true,
        ignore: options.excludePatterns,
      });
      result.forEach(f => processedPaths.add(f));
    } else if (FILE_CATEGORIES[category]) {
      const cat = FILE_CATEGORIES[category];
      cat.patterns.forEach(pattern => {
        try {
          const result = globSync(pattern, {
            cwd: SRC_DIR,
            absolute: true,
            ignore: options.excludePatterns,
          });
          result.forEach(f => processedPaths.add(f));
        } catch (e) {
          // 忽略无效模式
        }
      });
    }
  }

  files = Array.from(processedPaths);

  // 过滤掉不包含 console 的文件
  files = files.filter(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      return /console\.(log|warn|error|debug|info)\(/.test(content);
    } catch (e) {
      return false;
    }
  });

  return files.sort();
}

/**
 * 分析文件中的 console 语句
 */
function analyzeConsoleStatements(content, filePath) {
  const statements = [];
  const lines = content.split('\n');
  const fileName = path.basename(filePath, path.extname(filePath));

  lines.forEach((line, index) => {
    const consoleMatch = line.match(/console\.(log|warn|error|debug|info)\((.*)\)/);
    if (consoleMatch) {
      statements.push({
        line: index + 1, // 行号从1开始
        type: consoleMatch[1], // log/warn/error
        rawContent: consoleMatch[2], // console() 内的内容
        fullLine: line.trim(),
        indent: line.match(/^(\s*)/)[1], // 缩进
      });
    }
  });

  return statements;
}

/**
 * 检测代码上下文 (类组件 vs 函数组件)
 *
 * 策略:
 * - 检测 class 关键字 → 使用 this.logger
 * - 检测 function/const/箭头函数 → 使用 logger
 * - 默认使用 logger (更安全)
 */
function detectContext(content, lineIndex) {
  const lines = content.split('\n');

  // 向上查找最近的上下文标识符
  for (let i = Math.max(0, lineIndex - 50); i < lineIndex; i++) {
    const line = lines[i].trim();

    // 检测类方法 (constructor, 方法名)
    if (/^\s*(public|private|protected|async\s+)?\s*\w+\s*\([^)]*\)\s*\{/.test(line) ||
        /^\s*constructor\s*\(/.test(line)) {
      // 检查是否在 class 内部
      for (let j = i; j >= Math.max(0, i - 100); j--) {
        if (/^class\s+\w+/.test(lines[j].trim())) {
          return 'class'; // 在类内部的方法
        }
      }
    }

    // 检测函数/箭头函数
    if (/^(export\s+)?(async\s+)?function\s+\w+|^\s*(const|let|var)\s+\w+\s*=/.test(line) &&
        !/^class\s+/.test(line)) {
      return 'function'; // 在普通函数中
    }
  }

  // 检测整个文件的类型
  const fileContent = content.substring(0, Math.min(1000, content.length));
  if (/^class\s+\w+/m.test(fileContent)) {
    return 'class'; // 文件主要包含类
  }

  return 'function'; // 默认使用函数风格 (logger)
}

/**
 * 生成 Logger 替换代码
 */
function generateLoggerReplacement(statement, fileName, content, lineIndex) {
  const { type, rawContent, indent } = statement;

  // 映射 console 类型到 Logger 方法
  const methodMap = {
    'log': 'info',
    'warn': 'warn',
    'error': 'error',
    'debug': 'debug',
    'info': 'info',
  };

  const loggerMethod = methodMap[type] || 'info';

  // 检测上下文 (类 vs 函数)
  const context = detectContext(content, lineIndex);
  const loggerPrefix = context === 'class' ? 'this.logger' : 'logger';

  // 提取日志消息和额外参数
  let message = '';
  let extraParams = '';

  // 简单解析 console 参数
  if (rawContent.includes(',')) {
    const parts = rawContent.split(',').map(p => p.trim());
    message = parts[0].replace(/^['"`]|['"`]$/g, ''); // 移除引号
    extraParams = parts.slice(1).join(', ');
  } else {
    message = rawContent.replace(/^['"`]|['"`]$/g, '');
  }

  // 清理消息中的前缀标签 (如 [PluginSystem])
  const prefixPattern = /^\[([^\]]+)\]\s*/;
  const cleanMessage = message.replace(prefixPattern, '').trim();

  // 生成替换代码
  if (extraParams) {
    return `${indent}${loggerPrefix}.${loggerMethod}(${rawContent});`;
  } else if (cleanMessage) {
    return `${indent}${loggerPrefix}.${loggerMethod}('${cleanMessage}');`;
  } else {
    return `${indent}${loggerPrefix}.${loggerMethod}('Operation completed');`;
  }
}

/**
 * 查找导入块的结束位置 (支持多行import)
 *
 * 处理以下情况:
 * - 单行: import React from 'react';
 * - 多行: import React, { createContext, ... } from 'react';
 * - 混合: 多个连续的 import 语句
 */
function findImportBlockEnd(lines) {
  let lastImportLine = -1;
  let inMultiLineImport = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 检测 import 语句开始
    if (line.startsWith('import ')) {
      // 检测是否是多行 import (以 { 或 , 结尾且没有 from)
      if ((line.endsWith('{') || line.endsWith(',')) && !line.includes('from')) {
        inMultiLineImport = true;
        lastImportLine = i;
      } else if (line.includes(';') || line.includes('from')) {
        // 单行 import 完成
        lastImportLine = i;
        inMultiLineImport = false;
      }
    }
    // 检测多行 import 继续
    else if (inMultiLineImport && (line.includes('from') || line.includes('}'))) {
      // 多行 import 结束
      if (line.includes(';') || line.includes('from')) {
        inMultiLineImport = false;
        lastImportLine = i;
      }
    }
    // 遇到非 import 语句，结束检测
    else if (!inMultiLineImport && line !== '' && !line.startsWith('//') && !line.startsWith('*') && !line.startsWith('@') && lastImportLine >= 0) {
      break;
    }
  }

  return lastImportLine + 1; // 返回应该插入的位置 (在最后一个 import 之后)
}

/**
 * 智能添加 Logger import
 *
 * 策略:
 * 1. 查找所有 import 块的结束位置
 * 2. 在最后一个 import 之后插入 Logger import
 * 3. 保持代码格式和缩进一致
 */
function addLoggerImport(content, filePath) {
  const lines = content.split('\n');

  // 检查是否已经有 Logger import
  if (content.includes("import { logger }") || content.includes("from './Logger'")) {
    return { content, added: false };
  }

  // 查找 import 块的结束位置
  const insertPosition = findImportBlockEnd(lines);

  if (insertPosition === 0) {
    return { content, added: false }; // 没有找到 import 块
  }

  // 计算相对路径到 Logger
  const relativePathToLogger = getRelativePathToLogger(filePath);
  const loggerImport = `import { logger } from "${relativePathToLogger}";`;

  // 插入 Logger import
  lines.splice(insertPosition, 0, loggerImport);

  return {
    content: lines.join('\n'),
    added: true,
    position: insertPosition,
  };
}

/**
 * 处理单个文件
 */
function processFile(filePath, options) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, path.extname(filePath));
  const relativePath = path.relative(SRC_DIR, filePath);

  const statements = analyzeConsoleStatements(content, filePath);

  if (statements.length === 0) {
    return null;
  }

  const result = {
    file: relativePath,
    totalStatements: statements.length,
    breakdown: {},
    replacements: [],
  };

  // 统计各类型数量
  statements.forEach(s => {
    result.breakdown[s.type] = (result.breakdown[s.type] || 0) + 1;
  });

  // 如果是仅统计模式，返回不修改
  if (options.statsOnly) {
    return result;
  }

  // 如果是预览模式，只生成报告
  if (options.dryRun) {
    result.replacements = statements.map(s => ({
      line: s.line,
      original: s.fullLine,
      suggested: generateLoggerReplacement(s, fileName, content, s.line),
    }));
    return result;
  }

  // 实际执行替换
  let newContent = content;
  let modifiedLines = 0;

  // 从后向前替换，避免行号偏移
  const sortedStatements = [...statements].sort((a, b) => b.line - a.line);

  for (const statement of sortedStatements) {
    const replacement = generateLoggerReplacement(statement, fileName, content, statement.line);
    const lines = newContent.split('\n');

    if (lines[statement.line - 1]?.includes('console.')) {
      lines[statement.line - 1] = replacement;
      newContent = lines.join('\n');
      modifiedLines++;

      result.replacements.push({
        line: statement.line,
        original: statement.fullLine,
        replacedWith: replacement,
      });
    }
  }

  // 检查是否需要添加 Logger import (使用改进的智能插入)
  if (modifiedLines > 0) {
    const loggerResult = addLoggerImport(newContent, filePath);
    newContent = loggerResult.content;

    if (loggerResult.added) {
      result.addedImport = true;
      result.importPosition = loggerResult.position;
    }
  }

  // 写入修改后的内容
  if (modifiedLines > 0) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    result.modified = true;
    result.modifiedLines = modifiedLines;
  }

  return result;
}

/**
 * 计算相对路径到 Logger
 *
 * Logger 位置: src/app/components/ide/services/Logger.ts
 * 需要生成正确的相对路径
 */
function getRelativePathToLogger(targetFile) {
  const targetDir = path.dirname(targetFile);
  const loggerFile = path.join(SRC_DIR, 'services', 'Logger.ts');
  const relative = path.relative(targetDir, loggerFile);

  // 移除 .ts 扩展名 (TypeScript 自动解析)
  const withoutExt = relative.replace(/\.ts$/, '');

  // 确保路径以 ./ 开头
  return withoutExt.startsWith('.') ? withoutExt : `./${withoutExt}`;
}

/**
 * 生成统计报告
 */
function generateReport(results, options) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 YYC³ Console 清理报告');
  console.log('='.repeat(80));
  console.log(`📅 时间: ${new Date().toISOString()}`);
  console.log(`🔧 模式: ${options.dryRun ? '👁️  预览 (Dry Run)' : '✏️  实际修改'}`);
  console.log(`📂 范围: ${options.categories.join(', ')}`);
  console.log('-'.repeat(80));

  // 总体统计
  const totalFiles = results.filter(r => r).length;
  const totalStatements = results.reduce((sum, r) => sum + (r?.totalStatements || 0), 0);
  const totalModified = results.reduce((sum, r) => sum + (r?.modifiedLines || 0), 0);

  const breakdown = {};
  results.forEach(r => {
    if (r?.breakdown) {
      Object.entries(r.breakdown).forEach(([type, count]) => {
        breakdown[type] = (breakdown[type] || 0) + count;
      });
    }
  });

  console.log('\n📈 总体统计:');
  console.log(`   📁 处理文件数: ${totalFiles}`);
  console.log(`   📝 Console总数: ${totalStatements}`);
  console.log(`   ✅ 已清理数量: ${totalModified}`);

  if (!options.statsOnly && !options.dryRun) {
    console.log(`   🔄 修改率: ${totalStatements > 0 ? ((totalModified / totalStatements) * 100).toFixed(1) : 0}%`);
  }

  console.log('\n📊 Console 类型分布:');
  Object.entries(breakdown)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      const icon = type === 'log' ? '🔵' : type === 'warn' ? '🟡' : type === 'error' ? '🔴' : '⚪';
      const bar = '█'.repeat(Math.ceil(count / Math.max(...Object.values(breakdown)) * 20));
      console.log(`   ${icon} console.${type.padEnd(5)}: ${String(count).padStart(4)} ${bar}`);
    });

  // 详细列表 (仅在非统计模式)
  if (!options.statsOnly && totalFiles > 0) {
    console.log('\n📋 文件详情:');
    console.log('-'.repeat(80));

    results
      .filter(r => r && r.totalStatements > 0)
      .sort((a, b) => b.totalStatements - a.totalStatements)
      .forEach((r, index) => {
        const statusIcon = r?.modified ? '✅' : options.dryRun ? '👁️' : '⏭️';
        console.log(`${(index + 1).toString().padStart(2)}. ${statusIcon} ${r.file}`);
        console.log(`     Console: ${r.totalStatements}个 | ${Object.entries(r.breakdown || {}).map(([t, c]) => `${t}:${c}`).join(', ')}`);

        // 显示替换示例 (限制前3个)
        if ((options.dryRun || r?.replacements?.length > 0) && index < 10) {
          const examples = (r.replacements || []).slice(0, 3);
          examples.forEach(repl => {
            console.log(`       L${repl.line}: ${repl.original.substring(0, 60)}...`);
            if (options.dryRun) {
              console.log(`           → ${repl.suggested?.substring(0, 60)}...`);
            }
          });
          if (r.totalStatements > 3) {
            console.log(`       ... 还有 ${r.totalStatements - 3} 个`);
          }
        }
      });

    if (totalFiles > 10) {
      console.log(`\n   ... 还有 ${totalFiles - 10} 个文件未显示`);
    }
  }

  // 建议
  console.log('\n💡 建议:');
  if (totalStatements === 0) {
    console.log('   ✨ 太棒了！所有选定的文件都已经清理干净！');
  } else if (options.dryRun) {
    console.log('   🔧 运行不带 --dry-run 参数来实际执行清理');
    console.log('   📦 建议先从 core 类别开始: --core');
  } else {
    console.log(`   ✅ 成功清理 ${totalModified}/${totalStatements} 个 console 语句`);
    console.log('   🧪 运行 pnpm typecheck 验证类型正确性');
    console.log('   🧪 运行 pnpm test 验证功能完整性');
  }

  console.log('\n' + '='.repeat(80) + '\n');

  return {
    totalFiles,
    totalStatements,
    totalModified,
    breakdown,
  };
}

// ── 主程序 ──
async function main() {
  console.log('🚀 YYC³ Console 清理工具 v1.0.0\n');

  const options = parseArgs();

  console.log(`📂 扫描目录: ${SRC_DIR}`);
  console.log(`🎯 目标类别: ${options.categories.join(', ')}`);
  console.log(`🔧 模式: ${options.dryRun ? '👁️  预览模式' : '✏️  实际修改'}\n`);

  // 获取文件列表
  const files = getFiles(options);

  if (files.length === 0) {
    console.log('✅ 未找到包含 console 语句的文件！');
    console.log('   所有代码已经符合 YYC³ 标准。\n');
    process.exit(0);
  }

  console.log(`📁 发现 ${files.length} 个包含 console 的文件:\n`);

  // 处理每个文件
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = `[${i + 1}/${files.length}]`;

    try {
      const result = processFile(file, options);
      if (result) {
        results.push(result);
        const icon = result.modified ? '✅' : '📝';
        console.log(`${progress} ${icon} ${result.file} (${result.totalStatements}个)`);
      }
    } catch (error) {
      console.error(`${progress} ❌ 错误处理 ${file}:`, error.message);
    }
  }

  // 生成报告
  const report = generateReport(results, options);

  // 输出 JSON 格式结果 (可选，用于 CI/CD)
  if (process.env.JSON_OUTPUT === 'true') {
    const jsonPath = path.join(__dirname, 'console-cleanup-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      options,
      results,
      summary: report,
    }, null, 2));
    console.log(`📄 详细报告已保存: ${jsonPath}\n`);
  }

  // 退出码
  process.exit(report.totalStatements > 0 && !options.dryRun && report.totalModified === 0 ? 1 : 0);
}

// 运行
main().catch(error => {
  console.error('❌ 致命错误:', error);
  process.exit(1);
});
