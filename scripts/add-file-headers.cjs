#!/usr/bin/env node

/**
 * @file add-file-headers.js
 * @description YYC³ 自动化工具 - 批量为源代码文件添加标准标头注释
 * @author YanYuCloudCube Team
 * @version 1.0.0
 *
 * 使用方法:
 *   node scripts/add-file-headers.js [选项]
 *
 * 选项:
 *   --dry-run    仅预览，不修改文件 (默认)
 *   --apply      实际应用更改到文件
 *   --verbose    显示详细输出
 *   --stats      仅显示统计信息
 */

const fs = require('fs')
const path = require('path')

// ================================================================
// 配置常量
// ================================================================

const CONFIG = {
  // 源码目录
  srcDir: path.join(__dirname, '..', 'src'),

  // 要处理的文件扩展名
  extensions: ['.ts', '.tsx'],

  // 排除的目录
  excludeDirs: [
    'node_modules',
    'dist',
    'coverage',
    '__tests__',
    '.storybook',
    'stories',
    'imports'
  ],

  // 标准标头模板
  headerTemplate: ({ filePath, description, tags, status }) => {
    const fileName = path.basename(filePath)
    const today = new Date().toISOString().split('T')[0]
    const relativePath = path.relative(path.join(__dirname, '..'), filePath)

    return `/**
 * @file: ${fileName}
 * @description: ${description}
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: ${today}
 * @updated: ${today}
 * @status: ${status}
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: ${tags}
 */
`
  },

  // 默认状态映射
  defaultStatus: {
    '.ts': 'stable',
    '.tsx': 'production',
    '.test.ts': 'test',
    '.test.tsx': 'test'
  }
}

// ================================================================
// 工具函数
// ================================================================

/**
 * 从文件路径推断描述
 */
function inferDescription(filePath) {
  const relativePath = path.relative(CONFIG.srcDir, filePath)
  const parts = relativePath.split(path.sep)
  const fileName = path.basename(filePath, path.extname(filePath))

  // 目录关键词映射
  const dirKeywords = {
    'agent': 'AI Agent',
    'components': 'UI 组件',
    'services': '服务层',
    'utils': '工具函数',
    'hooks': 'React Hooks',
    'stores': '状态管理',
    'types': '类型定义',
    'constants': '常量定义',
    'config': '配置模块',
    'adapters': '适配器',
    'plugins': '插件'
  }

  // 文件名关键词映射
  const fileKeywords = {
    'Service': '服务',
    'Manager': '管理器',
    'Handler': '处理器',
    'Provider': '提供者',
    'Component': '组件',
    'Store': '存储',
    'Util': '工具',
    'Helper': '辅助',
    'Config': '配置',
    'Types': '类型定义',
    'Interface': '接口定义',
    'Constants': '常量',
    'Hook': '钩子函数'
  }

  let description = ''

  // 从目录推断
  for (const dir of parts.slice(0, -1)) {
    if (dirKeywords[dir]) {
      description += dirKeywords[dir] + ' — '
    }
  }

  // 从文件名推断
  for (const [keyword, meaning] of Object.entries(fileKeywords)) {
    if (fileName.includes(keyword)) {
      description += `${fileName} ${meaning}`
      break
    }
  }

  if (!description) {
    description = `${fileName} 模块`
  }

  return description.trim()
}

/**
 * 从文件路径和内容推断标签
 */
function inferTags(filePath) {
  const relativePath = path.relative(CONFIG.srcDir, filePath).toLowerCase()
  const tags = []

  // 基于路径的标签
  if (relativePath.includes('agent')) tags.push('agent')
  if (relativePath.includes('crypto') || relativePath.includes('encrypt')) tags.push('security')
  if (relativePath.includes('storage')) tags.push('storage')
  if (relativePath.includes('ai')) tags.push('ai')
  if (relativePath.includes('ui')) tags.push('ui')
  if (relativePath.includes('theme')) tags.push('theme')
  if (relativePath.includes('test')) tags.push('testing')

  return tags.length > 0 ? tags.join(',') : 'yyc3,module'
}

/**
 * 推断文件状态
 */
function inferStatus(filePath) {
  const ext = path.extname(filePath)

  if (filePath.includes('.test.') || filePath.includes('.spec.')) {
    return 'test'
  }

  if (filePath.includes('__mocks__')) {
    return 'mock'
  }

  return CONFIG.defaultStatus[ext] || 'stable'
}

/**
 * 检查文件是否已有标头
 */
function hasHeader(content) {
  return content.startsWith('/**') && content.includes('@file:')
}

/**
 * 获取所有需要处理的文件
 */
function getTargetFiles(dir, excludeDirs = []) {
  let files = []

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          files = files.concat(getTargetFiles(fullPath, excludeDirs))
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (CONFIG.extensions.includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  } catch (err) {
    console.error(`无法读取目录: ${dir}`, err.message)
  }

  return files
}

// ================================================================
// 主逻辑
// ================================================================

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = !args.includes('--apply')
  const isVerbose = args.includes('--verbose')
  const isStatsOnly = args.includes('--stats')

  console.log('\n' + '='.repeat(70))
  console.log('🔧 YYC³ File Header Generator v1.0.0')
  console.log('='.repeat(70))
  console.log(`\n模式: ${isDryRun ? '🔍 预览模式 (Dry Run)' : '✏️ 应用模式 (Apply)'}`)
  console.log(`目录: ${CONFIG.srcDir}\n`)

  // 获取所有目标文件
  const allFiles = getTargetFiles(CONFIG.srcDir, CONFIG.excludeDirs)
  console.log(`📊 找到 ${allFiles.length} 个源文件\n`)

  // 分类统计
  const stats = {
    total: allFiles.length,
    hasHeader: 0,
    needsHeader: 0,
    processed: [],
    skipped: []
  }

  // 处理每个文件
  for (const filePath of allFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')

      if (hasHeader(content)) {
        stats.hasHeader++
        stats.skipped.push({
          path: filePath,
          reason: '已有标头'
        })

        if (isVerbose) {
          console.log(`⏭️  跳过: ${path.relative(CONFIG.srcDir, filePath)} (已有标头)`)
        }
        continue
      }

      stats.needsHeader++

      // 生成标头信息
      const headerInfo = {
        filePath,
        description: inferDescription(filePath),
        tags: inferTags(filePath),
        status: inferStatus(filePath)
      }

      // 生成标头
      const header = CONFIG.headerTemplate(headerInfo)
      const newContent = header + '\n' + content

      if (!isStatsOnly) {
        if (isDryRun) {
          console.log(`\n${'─'.repeat(60)}`)
          console.log(`📝 文件: ${path.relative(CONFIG.srcDir, filePath)}`)
          console.log(`${'─'.repeat(60)}`)
          console.log(header)
          if (isVerbose) {
            console.log(`📍 标签: ${headerInfo.tags}`)
            console.log(`📍 状态: ${headerInfo.status}`)
            console.log(`📍 描述: ${headerInfo.description}`)
          }
        } else {
          // 实际写入文件
          fs.writeFileSync(filePath, newContent, 'utf8')
          console.log(`✅ 已添加标头: ${path.relative(CONFIG.srcDir, filePath)}`)
        }
      }

      stats.processed.push({
        path: filePath,
        ...headerInfo
      })

    } catch (err) {
      console.error(`❌ 处理失败: ${filePath}`, err.message)
    }
  }

  // 输出统计信息
  console.log('\n' + '='.repeat(70))
  console.log('📈 处理统计')
  console.log('='.repeat(70))
  console.log(`\n总文件数: ${stats.total}`)
  console.log(`已有标头: ${stats.hasHeader} (${(stats.hasHeader / stats.total * 100).toFixed(1)}%)`)
  console.log(`需添加标头: ${stats.needsHeader} (${(stats.needsHeader / stats.total * 100).toFixed(1)}%)`)
  console.log(`标头覆盖率: ${((stats.hasHeader / stats.total) * 100).toFixed(1)}% → ${(((stats.hasHeader + stats.needsHeader) / stats.total) * 100).toFixed(1)}%`)

  if (!isDryRun && stats.needsHeader > 0) {
    console.log(`\n✨ 成功为 ${stats.needsHeader} 个文件添加了 YYC³ 标准标头!`)
  } else if (isDryRun && stats.needsHeader > 0) {
    console.log(`\n💡 预览完成! 运行 'node scripts/add-file-headers.js --apply' 以实际应用更改`)
  }

  console.log('\n' + '='.repeat(70) + '\n')

  // 返回退出码
  process.exit(stats.needsHeader > 0 ? 0 : 0)
}

// 执行主函数
main().catch(err => {
  console.error('执行出错:', err)
  process.exit(1)
})
