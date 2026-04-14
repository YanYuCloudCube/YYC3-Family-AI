#!/bin/bash

# ============================================================
# YYC³ Family AI - 智能 CI/CD 诊断脚本
# @description: 自动化检测 CI/CD 环境差异和潜在问题
# @author: YanYuCloudCube Team <admin@0379.email>
# @version: v1.0.0
# @created: 2026-04-14
# ============================================================

set -e

echo "🔍 YYC³ Family AI - 智能 CI/CD 诊断系统"
echo "================================================"
echo ""

# ── 颜色定义 ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ── 统计变量 ──
PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

# ── 辅助函数 ──
pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASS_COUNT++))
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARN_COUNT++))
}

fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAIL_COUNT++))
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ════════════════════════════════════════════════════════
# 阶段 1: 环境检查
# ════════════════════════════════════════════════════════
echo "📋 阶段 1: 环境配置检查"
echo "----------------------------------------"

# Node.js 版本检查
NODE_VERSION=$(node --version 2>/dev/null || echo "未安装")
if [[ "$NODE_VERSION" =~ ^v2[0-9] ]]; then
    pass "Node.js 版本: $NODE_VERSION (符合要求)"
else
    fail "Node.js 版本: $NODE_VERSION (需要 v20+)"
fi

# pnpm 检查
PNPM_VERSION=$(pnpm --version 2>/dev/null || echo "未安装")
if [ -n "$PNPM_VERSION" ]; then
    pass "pnpm 版本: $PNPM_VERSION"
else
    fail "pnpm 未安装"
fi

# Corepack 检查
if command -v corepack &> /dev/null; then
    COREPACK_STATUS=$(corepack status 2>&1 || echo "未知")
    if [[ "$COREPACK_STATUS" == *"enabled"* ]] || [[ "$COREPACK_STATUS" == *"Enabled"* ]]; then
        pass "Corepack 已启用"
    else
        warn "Corepack 未启用 ($COREPACK_STATUS)"
    fi
else
    warn "Corepack 未安装"
fi

# Git 检查
GIT_VERSION=$(git --version | awk '{print $3}')
pass "Git 版本: $GIT_VERSION"

# GitHub CLI 检查
if command -v gh &> /dev/null; then
    GH_AUTH=$(gh auth status 2>&1 || echo "未认证")
    if [[ "$GH_AUTH" == *"Logged in"* ]]; then
        pass "GitHub CLI 已认证"
    else
        warn "GitHub CLI 未认证"
    fi
else
    warn "GitHub CLI 未安装"
fi

echo ""

# ════════════════════════════════════════════════════════
# 阶段 2: 项目配置检查
# ════════════════════════════════════════════════════════
echo "📦 阶段 2: 项目配置验证"
echo "----------------------------------------"

# package.json 检查
if [ -f "package.json" ]; then
    pass "package.json 存在"
    
    # 提取 packageManager 字段
    PKG_MANAGER=$(node -e "const p=require('./package.json');console.log(p.packageManager||'未指定')" 2>/dev/null)
    if [[ "$PKG_MANAGER" != "未指定" ]]; then
        info "包管理器: $PKG_MANAGER"
        
        # 检查 lockfile 一致性
        if [ -f "pnpm-lock.yaml" ]; then
            LOCKFILE_VERSION=$(head -1 pnpm-lock.yaml | grep -oP 'lockfileVersion: \K\d+' || echo "未知")
            pass "pnpm-lock.yaml 存在 (版本: $LOCKFILE_VERSION)"
            
            # 验证 lockfile 完整性
            if pnpm install --frozen-lockfile --dry-run 2>&1 | grep -q "error"; then
                fail "Lockfile 可能损坏或不一致"
            else
                pass "Lockfile 完整性验证通过"
            fi
        else
            fail "缺少 pnpm-lock.yaml"
        fi
    else
        warn "package.json 中未指定 packageManager"
    fi
else
    fail "package.json 不存在"
fi

# vitest.config.ts 检查
if [ -f "vitest.config.ts" ]; then
    pass "Vitest 配置文件存在"
    
    # 检查环境配置
    ENV_CONFIG=$(grep -o 'environment: "[^"]*"' vitest.config.ts | head -1)
    if [ -n "$ENV_CONFIG" ]; then
        info "测试环境: $ENV_CONFIG"
    fi
    
    # 检查 globalSetup
    if grep -q "globalSetup" vitest.config.ts; then
        GLOBAL_SETUP=$(grep -oP 'globalSetup: \["[^"]+"\]' vitest.config.ts | head -1)
        info "全局设置: $GLOBAL_SETUP"
        pass "已配置 globalSetup"
    else
        warn "未配置 globalSetup (可能导致环境初始化问题)"
    fi
    
    # 检查 setupFiles
    SETUP_FILES=$(grep -oP 'setupFiles: \[[^\]]+\]' vitest.config.ts | head -1)
    if [ -n "$SETUP_FILES" ]; then
        info "测试设置文件: $SETUP_FILES"
    fi
else
    fail "vitest.config.ts 不存在"
fi

echo ""

# ════════════════════════════════════════════════════════
# 阶段 3: Web Crypto API 兼容性分析
# ════════════════════════════════════════════════════════
echo "🔐 阶段 3: Web Crypto API 兼容性深度分析"
echo "----------------------------------------"

# 检测 crypto 可用性
CRYPTO_CHECK=$(node -e "
try {
    const { webcrypto } = require('node:crypto');
    console.log('AVAILABLE');
    console.log(typeof webcrypto.subtle);
    console.log(webcrypto.subtle ? 'SUBTLE_OK' : 'NO_SUBTLE');
} catch(e) {
    console.log('ERROR:' + e.message);
}
" 2>/dev/null)

CRYPTO_STATUS=$(echo "$CRYPTO_CHECK" | head -1)
CRYPTO_TYPE=$(echo "$CRYPTO_CHECK" | sed -n '2p')
SUBTLE_STATUS=$(echo "$CRYPTO_CHECK" | sed -n '3p')

if [[ "$CRYPTO_STATUS" == "AVAILABLE" ]]; then
    pass "Node.js WebCrypto API 可用"
    
    if [[ "$SUBTLE_STATUS" == "SUBTLE_OK" ]]; then
        pass "SubtleCrypto API 正常工作"
    else
        fail "SubtleCrypto API 不可用"
    fi
else
    fail "WebCrypto API 不可用: $CRYPTO_STATUS"
fi

# 检查 global-setup.ts
if [ -f "src/__tests__/global-setup.ts" ]; then
    pass "global-setup.ts 存在"
    
    # 分析内容
    HAS_WEBCRYPTO_IMPORT=$(grep -c "import.*node:crypto" src/__tests__/global-setup.ts || true)
    HAS_CRYPTO_ASSIGNMENT=$(grep -c "globalThis.crypto" src/__tests__/global-setup.ts || true)
    
    if [ "$HAS_WEBCRYPTO_IMPORT" -gt 0 ]; then
        pass "包含 node:crypto 导入"
    else
        fail "缺少 node:crypto 导入"
    fi
    
    if [ "$HAS_CRYPTO_ASSIGNMENT" -gt 0 ]; then
        pass "包含 crypto 赋值逻辑"
    else
        fail "缺少 crypto 赋值逻辑"
    fi
else
    fail "global-setup.ts 不存在 (关键!)"
fi

# 检查 setup.ts
if [ -f "src/__tests__/setup.ts" ]; then
    pass "setup.ts 存在"
    
    # 检查是否有 Web Crypto 设置
    HAS_SETUP_CRYPTO=$(grep -c "webcrypto\|crypto" src/__tests__/setup.ts || true)
    if [ "$HAS_SETUP_CRYPTO" -gt 0 ]; then
        info "setup.ts 包含 $HAS_SETUP_CRYPTO 处 crypto 相关代码"
    fi
fi

# 统计使用加密的测试文件
ENCRYPTION_TEST_FILES=$(find src -name "*.test.ts" -exec grep -l "EncryptionService\|crypto.subtle\|importKey\|deriveKey" {} \; 2>/dev/null | wc -l)
info "使用加密功能的测试文件数量: $ENCRYPTION_TEST_FILES"

# 检查是否使用了 @vitest-environment node
NODE_ENV_TESTS=$(find src -name "*.test.ts" -exec grep -l "@vitest-environment node" {} \; 2>/dev/null | wc -l)
info "使用 Node.js 环境的测试文件: $NODE_ENV_TESTS"

echo ""

# ════════════════════════════════════════════════════════
# 阶段 4: CI/CD 工作流分析
# ════════════════════════════════════════════════════════
echo "🔄 阶段 4: CI/CD 工作流配置审查"
echo "----------------------------------------"

WORKFLOW_DIR=".github/workflows"
if [ -d "$WORKFLOW_DIR" ]; then
    WORKFLOW_COUNT=$(ls -1 "$WORKFLOW_DIR"/*.yml 2>/dev/null | wc -l)
    pass "发现 $WORKFLOW_COUNT 个工作流文件"
    
    for workflow in "$WORKFLOW_DIR"/*.yml; do
        WF_NAME=$(basename "$workflow")
        info "检查: $WF_NAME"
        
        # 检查 Corepack 使用
        if grep -q "corepack enable" "$workflow"; then
            pass "  ✓ 使用 Corepack"
        elif grep -q "pnpm/action-setup" "$workflow"; then
            warn "  ⚠ 使用旧版 pnpm/action-setup (建议迁移到 Corepack)"
        fi
        
        # 检查 Node.js 版本
        NODE_VER_IN_WF=$(grep -oP 'node-version: \K[^ \n]+' "$workflow" | head -1)
        if [ -n "$NODE_VER_IN_WF" ]; then
            info "  Node.js 版本: $NODE_VER_IN_WF"
        fi
        
        # 检查缓存策略
        if grep -q "cache:" "$workflow"; then
            CACHE_TYPE=$(grep -A1 "cache:" "$workflow" | tail -1 | tr -d ' ')
            info "  缓存策略: $CACHE_TYPE"
        fi
    done
else
    fail ".github/workflows 目录不存在"
fi

echo ""

# ════════════════════════════════════════════════════════
# 阶段 5: 常见问题模式识别
# ════════════════════════════════════════════════════════
echo "🔬 阶段 5: CI/CD 失败根因模式识别"
echo "----------------------------------------"

# 模式 1: ArrayBuffer 类型问题
AB_ISSUES=$(find src -name "*.ts" -not -path "*__tests__*" -exec grep -l "toArrayBuffer\|\.buffer\|ArrayBuffer" {} \; 2>/dev/null | wc -l)
if [ "$AB_ISSUES" -gt 0 ]; then
    info "发现 $AB_ISSUES 个文件涉及 ArrayBuffer 操作"
    info "   → 这类代码在 jsdom 和 Node.js 环境行为可能不同"
fi

# 模式 2: 测试环境不一致
JSDOM_TESTS=$(find src -name "*.test.ts" ! -exec grep -q "@vitest-environment node" {} \; -print | xargs grep -l "crypto\|encrypt\|decrypt" 2>/dev/null | wc -l)
if [ "$JSDOM_TESTS" -gt 0 ]; then
    warn "发现 $JSDOM_TESTS 个加密相关测试运行在默认 jsdom 环境"
    info "   → 这些测试可能在 CI 中因 SubtleCrypto 兼容性问题失败"
fi

# 模式 3: 全局状态污染
GLOBAL_STATE_FILES=$(find src -name "*.test.ts" -exec grep -l "globalThis\|global\." {} \; 2>/dev/null | wc -l)
if [ "$GLOBAL_STATE_FILES" -gt 0 ]; then
    info "发现 $GLOBAL_STATE_FILES 个测试修改全局状态"
    info "   → 可能导致测试间相互影响，特别是在并行执行时"
fi

# 模式 4: 异步测试问题
ASYNC_WITHOUT_AWAIT=$(find src -name "*.test.ts" -exec grep -l "async.*(" {} \; 2>/dev/null | while read file; do
    MISSING_AWAIT=$(grep -c "it\(.*\)async" "$file" 2>/dev/null || true)
    if [ "$MISSING_AWAIT" -gt 0 ]; then
        echo "$file"
    fi
done | wc -l)
if [ "$ASYNC_WITHOUT_AWAIT" -gt 0 ]; then
    warn "可能存在异步处理不当的测试"
fi

echo ""

# ════════════════════════════════════════════════════════
# 阶段 6: 运行快速测试验证
# ════════════════════════════════════════════════════════
echo "🧪 阶段 6: 快速测试执行验证"
echo "----------------------------------------"

TEST_OUTPUT=$(timeout 120 pnpm test 2>&1 || echo "TIMEOUT")

if echo "$TEST_OUTPUT" | grep -q "Test Files"; then
    TEST_FILES_PASSED=$(echo "$TEST_OUTPUT" | grep "Test Files" | grep -oP '\d+(?= passed)' || echo "0")
    TESTS_PASSED=$(echo "$TEST_OUTPUT" | grep "Tests" | grep -oP '\d+(?= passed)' || echo "0")
    TESTS_SKIPPED=$(echo "$TEST_OUTPUT" | grep "Tests" | grep -oP '\d+(?= skipped)' || echo "0")
    
    pass "测试文件通过: $TEST_FILES_PASSED"
    pass "测试用例通过: $TESTS_PASSED"
    
    if [ "$TESTS_SKIPPED" -gt 0 ]; then
        info "测试用例跳过: $TESTS_SKIPPED"
    fi
    
    # 检查失败
    if echo "$TEST_OUTPUT" | grep -q "failed"; then
        FAIL_COUNT_TEST=$(echo "$TEST_OUTPUT" | grep "Test Files" | grep -oP '\d+(?= failed)' || echo "0")
        fail "测试文件失败: $FAIL_COUNT_TEST"
    fi
else
    fail "测试执行超时或异常"
fi

echo ""

# ════════════════════════════════════════════════════════
# 最终报告
# ════════════════════════════════════════════════════════
echo "================================================"
echo "📊 诊断报告总结"
echo "================================================"
echo ""
echo -e "${GREEN}✅ 通过: $PASS_COUNT 项${NC}"
echo -e "${YELLOW}⚠️  警告: $WARN_COUNT 项${NC}"
echo -e "${RED}❌ 失败: $FAIL_COUNT 项${NC}"
echo ""

TOTAL=$((PASS_COUNT + WARN_COUNT + FAIL_COUNT))
PASS_RATE=$((PASS_COUNT * 100 / TOTAL))

if [ "$PASS_RATE" -ge 90 ]; then
    echo -e "${GREEN}🎉 整体健康度: 优秀 ($PASS_RATE%)${NC}"
elif [ "$PASS_RATE" -ge 70 ]; then
    echo -e "${YELLOW}👍 整体健康度: 良好 ($PASS_RATE%)${NC}"
else
    echo -e "${RED}⚠️  整体健康度: 需要改进 ($PASS_RATE%)${NC}"
fi

echo ""
echo "💡 建议:"
echo "  1. 所有加密相关测试应使用 @vitest-environment node"
echo "  2. 确保 global-setup.ts 在 jsdom 初始化前设置 crypto"
echo "  3. 使用 Corepack 替代 pnpm/action-setup"
echo "  4. 保持 lockfile 与 package.json 同步"
echo "  5. 定期运行此诊断脚本以预防问题"
echo ""

exit 0
