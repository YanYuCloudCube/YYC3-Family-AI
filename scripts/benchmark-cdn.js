/**
 * @file scripts/benchmark-cdn.js
 * @description CDN 模式 vs 本地模式性能对比测试脚本
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags benchmark,cdn,performance
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 测试配置
const CONFIG = {
  iterations: 3,
  warmupRuns: 1,
  outputDir: 'benchmark-results',
};

// 测试结果存储
const results = {
  local: {
    buildTime: [],
    bundleSize: 0,
    chunks: [],
  },
  cdn: {
    buildTime: [],
    bundleSize: 0,
    chunks: [],
  },
};

// 工具函数
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatTime(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
}

function getDirectorySize(dirPath) {
  const { execSync } = require('child_process');
  try {
    const size = execSync(`du -sk ${dirPath} | cut -f1`, { encoding: 'utf-8' });
    return parseInt(size.trim()) * 1024;
  } catch {
    return 0;
  }
}

// 测试函数
async function benchmarkLocalMode() {
  console.log('\n📦 测试本地封装模式...\n');

  const buildTimes = [];

  for (let i = 0; i < CONFIG.warmupRuns; i++) {
    console.log(`  预热构建 ${i + 1}/${CONFIG.warmupRuns}...`);
    execSync('pnpm build', { stdio: 'inherit' });
  }

  for (let i = 0; i < CONFIG.iterations; i++) {
    console.log(`  正式构建 ${i + 1}/${CONFIG.iterations}...`);
    const start = Date.now();
    execSync('pnpm build', { stdio: 'pipe' });
    const duration = Date.now() - start;
    buildTimes.push(duration);
    console.log(`    构建时间: ${formatTime(duration)}`);
  }

  const avgBuildTime = buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length;
  const distSize = getDirectorySize('dist');

  results.local = {
    buildTime: buildTimes,
    bundleSize: distSize,
    avgBuildTime,
  };

  console.log(`\n  ✅ 本地模式平均构建时间: ${formatTime(avgBuildTime)}`);
  console.log(`  ✅ 本地模式构建产物大小: ${formatBytes(distSize)}\n`);
}

async function benchmarkCDNMode() {
  console.log('\n🌐 测试 CDN 模式...\n');

  const buildTimes = [];

  // 创建 CDN 环境配置
  writeFileSync('.env.cdn', 'USE_CDN=true\nCDN_BASE_URL=https://cdn.jsdelivr.net/npm\n');

  for (let i = 0; i < CONFIG.warmupRuns; i++) {
    console.log(`  预热构建 ${i + 1}/${CONFIG.warmupRuns}...`);
    execSync('pnpm build --mode cdn', { stdio: 'inherit' });
  }

  for (let i = 0; i < CONFIG.iterations; i++) {
    console.log(`  正式构建 ${i + 1}/${CONFIG.iterations}...`);
    const start = Date.now();
    execSync('pnpm build --mode cdn', { stdio: 'pipe' });
    const duration = Date.now() - start;
    buildTimes.push(duration);
    console.log(`    构建时间: ${formatTime(duration)}`);
  }

  const avgBuildTime = buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length;
  const distSize = getDirectorySize('dist');

  results.cdn = {
    buildTime: buildTimes,
    bundleSize: distSize,
    avgBuildTime,
  };

  console.log(`\n  ✅ CDN 模式平均构建时间: ${formatTime(avgBuildTime)}`);
  console.log(`  ✅ CDN 模式构建产物大小: ${formatBytes(distSize)}\n`);
}

function generateReport() {
  const { local, cdn } = results;

  const buildTimeImprovement = ((local.avgBuildTime - cdn.avgBuildTime) / local.avgBuildTime * 100).toFixed(1);
  const sizeReduction = ((local.bundleSize - cdn.bundleSize) / local.bundleSize * 100).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 性能对比报告');
  console.log('='.repeat(60));

  console.log('\n📦 构建时间对比:');
  console.log(`  本地模式: ${formatTime(local.avgBuildTime)}`);
  console.log(`  CDN 模式:  ${formatTime(cdn.avgBuildTime)}`);
  console.log(`  提升:      ${buildTimeImprovement > 0 ? '+' : ''}${buildTimeImprovement}%`);

  console.log('\n📏 构建产物大小对比:');
  console.log(`  本地模式: ${formatBytes(local.bundleSize)}`);
  console.log(`  CDN 模式:  ${formatBytes(cdn.bundleSize)}`);
  console.log(`  减少:      ${sizeReduction > 0 ? '-' : ''}${sizeReduction}%`);

  console.log('\n💡 建议:');
  if (parseFloat(buildTimeImprovement) > 10) {
    console.log('  ✅ CDN 模式构建时间显著更快，推荐生产环境使用');
  } else {
    console.log('  ⚠️  CDN 模式构建时间优势不明显，可根据实际需求选择');
  }

  if (parseFloat(sizeReduction) > 20) {
    console.log('  ✅ CDN 模式显著减小构建产物，推荐生产环境使用');
  } else {
    console.log('  ⚠️  CDN 模式体积优势有限，可根据实际需求选择');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // 保存详细报告
  const report = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results: {
      local: {
        avgBuildTime: local.avgBuildTime,
        bundleSize: local.bundleSize,
        buildTimes: local.buildTime,
      },
      cdn: {
        avgBuildTime: cdn.avgBuildTime,
        bundleSize: cdn.bundleSize,
        buildTimes: cdn.buildTime,
      },
      comparison: {
        buildTimeImprovement: parseFloat(buildTimeImprovement),
        sizeReduction: parseFloat(sizeReduction),
      },
    },
  };

  const reportPath = join(CONFIG.outputDir, `benchmark-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 详细报告已保存: ${reportPath}\n`);
}

// 主函数
async function main() {
  console.log('🚀 开始性能基准测试...\n');
  console.log(`配置: ${CONFIG.iterations} 次构建，${CONFIG.warmupRuns} 次预热\n`);

  try {
    await benchmarkLocalMode();
    await benchmarkCDNMode();
    generateReport();

    console.log('✅ 测试完成！\n');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

main();