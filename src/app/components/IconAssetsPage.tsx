/**
 * @file IconAssetsPage.tsx
 * @description YYC3 Design Prompt 图标资产查看器 - 展示从 GitHub YYC3-Design-Prompt/public/yyc3 拉取的全平台图标
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags icons,assets,github,viewer,multi-platform
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Smartphone,
  Monitor,
  Globe,
  Image as ImageIcon,
  Layers,
  CheckCircle2,
  Copy,
  Watch,
  Laptop,
} from "lucide-react";
import { copyToClipboard } from "./ide/utils/clipboard";

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/YYC-Cube/YanYuCloud/main/YYC3-Design-Prompt/public/yyc3";

const GITHUB_REPO_URL =
  "https://github.com/YYC-Cube/YanYuCloud/tree/main/YYC3-Design-Prompt/public/yyc3";

interface IconAsset {
  name: string;
  size: string;
  dimensions?: string;
  url: string;
  usage?: string;
}

interface IconCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  assets: IconAsset[];
}

function _encUrl(base: string, folder: string, file: string) {
  return `${base}/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
}

const categories: IconCategory[] = [
  {
    id: "webapp",
    label: "Web App",
    description: "Web 应用图标：Favicon、Apple Touch、Android Chrome",
    icon: <Globe className="size-5" />,
    color: "#3b82f6",
    assets: [
      {
        name: "favicon-16.png",
        size: "575 B",
        dimensions: "16x16",
        url: `${GITHUB_RAW_BASE}/Web%20App/favicon-16.png`,
        usage: "Browser tab icon",
      },
      {
        name: "favicon-32.png",
        size: "1.4 KB",
        dimensions: "32x32",
        url: `${GITHUB_RAW_BASE}/Web%20App/favicon-32.png`,
        usage: "Browser tab icon @2x",
      },
      {
        name: "apple-touch-icon.png",
        size: "20.4 KB",
        dimensions: "180x180",
        url: `${GITHUB_RAW_BASE}/Web%20App/apple-touch-icon.png`,
        usage: "iOS Safari bookmark",
      },
      {
        name: "android-chrome-192.png",
        size: "22.8 KB",
        dimensions: "192x192",
        url: `${GITHUB_RAW_BASE}/Web%20App/android-chrome-192.png`,
        usage: "Android Chrome PWA",
      },
      {
        name: "android-chrome-512.png",
        size: "105.5 KB",
        dimensions: "512x512",
        url: `${GITHUB_RAW_BASE}/Web%20App/android-chrome-512.png`,
        usage: "Android Chrome Splash",
      },
    ],
  },
  {
    id: "ios",
    label: "iOS",
    description: "iPhone / iPad 应用图标，含 App Store 1024px",
    icon: <Smartphone className="size-5" />,
    color: "#06b6d4",
    assets: [
      {
        name: "App Store.png",
        size: "315.2 KB",
        dimensions: "1024x1024",
        url: `${GITHUB_RAW_BASE}/iOS/App%20Store.png`,
        usage: "App Store listing",
      },
      {
        name: "iPhone App 3x.png",
        size: "20.3 KB",
        dimensions: "180x180",
        url: `${GITHUB_RAW_BASE}/iOS/iPhone%20App%203x.png`,
        usage: "iPhone App @3x",
      },
      {
        name: "iPhone App 2x.png",
        size: "11.5 KB",
        dimensions: "120x120",
        url: `${GITHUB_RAW_BASE}/iOS/iPhone%20App%202x.png`,
        usage: "iPhone App @2x",
      },
      {
        name: "iPhone Spotlight 3x.png",
        size: "11.5 KB",
        dimensions: "120x120",
        url: `${GITHUB_RAW_BASE}/iOS/iPhone%20Spotlight%203x.png`,
        usage: "Spotlight @3x",
      },
      {
        name: "iPhone Spotlight 2x.png",
        size: "6.3 KB",
        dimensions: "80x80",
        url: `${GITHUB_RAW_BASE}/iOS/iPhone%20Spotlight%202x.png`,
        usage: "Spotlight @2x",
      },
      {
        name: "iPhone Settings 3x.png",
        size: "6.9 KB",
        dimensions: "87x87",
        url: `${GITHUB_RAW_BASE}/iOS/iPhone%20Settings%203x.png`,
        usage: "Settings @3x",
      },
      {
        name: "iPhone Settings 2x.png",
        size: "3.8 KB",
        dimensions: "58x58",
        url: `${GITHUB_RAW_BASE}/iOS/iPhone%20Settings%202x.png`,
        usage: "Settings @2x",
      },
      {
        name: "iPhone Notification 3x.png",
        size: "4.0 KB",
        dimensions: "60x60",
        url: `${GITHUB_RAW_BASE}/iOS/iPhone%20Notification%203x.png`,
        usage: "Notification @3x",
      },
      {
        name: "iPhone Notification 2x.png",
        size: "2.2 KB",
        dimensions: "40x40",
        url: `${GITHUB_RAW_BASE}/iOS/iPhone%20Notification%202x.png`,
        usage: "Notification @2x",
      },
      {
        name: "iPad Pro App 2x.png",
        size: "19.0 KB",
        dimensions: "167x167",
        url: `${GITHUB_RAW_BASE}/iOS/iPad%20Pro%20App%202x.png`,
        usage: "iPad Pro App",
      },
      {
        name: "iPad App.png",
        size: "5.9 KB",
        dimensions: "76x76",
        url: `${GITHUB_RAW_BASE}/iOS/iPad%20App.png`,
        usage: "iPad App",
      },
      {
        name: "iPad Spotlight.png",
        size: "2.2 KB",
        dimensions: "40x40",
        url: `${GITHUB_RAW_BASE}/iOS/iPad%20Spotlight.png`,
        usage: "iPad Spotlight",
      },
      {
        name: "iPad Settings.png",
        size: "1.3 KB",
        dimensions: "29x29",
        url: `${GITHUB_RAW_BASE}/iOS/iPad%20Settings.png`,
        usage: "iPad Settings",
      },
      {
        name: "iPad Notification.png",
        size: "831 B",
        dimensions: "20x20",
        url: `${GITHUB_RAW_BASE}/iOS/iPad%20Notification.png`,
        usage: "iPad Notification",
      },
    ],
  },
  {
    id: "android",
    label: "Android",
    description: "Android 应用图标，含 Play Store 及各密度版本",
    icon: <Smartphone className="size-5" />,
    color: "#10b981",
    assets: [
      {
        name: "Play Store.png",
        size: "105.5 KB",
        dimensions: "512x512",
        url: `${GITHUB_RAW_BASE}/Android/Play%20Store.png`,
        usage: "Google Play Store",
      },
      {
        name: "xxxhdpi.png",
        size: "22.8 KB",
        dimensions: "192x192",
        url: `${GITHUB_RAW_BASE}/Android/xxxhdpi.png`,
        usage: "xxxhdpi (4x)",
      },
      {
        name: "xxhdpi.png",
        size: "15.4 KB",
        dimensions: "144x144",
        url: `${GITHUB_RAW_BASE}/Android/xxhdpi.png`,
        usage: "xxhdpi (3x)",
      },
      {
        name: "xhdpi.png",
        size: "8.0 KB",
        dimensions: "96x96",
        url: `${GITHUB_RAW_BASE}/Android/xhdpi.png`,
        usage: "xhdpi (2x)",
      },
      {
        name: "hdpi.png",
        size: "5.4 KB",
        dimensions: "72x72",
        url: `${GITHUB_RAW_BASE}/Android/hdpi.png`,
        usage: "hdpi (1.5x)",
      },
      {
        name: "mdpi.png",
        size: "2.8 KB",
        dimensions: "48x48",
        url: `${GITHUB_RAW_BASE}/Android/mdpi.png`,
        usage: "mdpi (1x)",
      },
    ],
  },
  {
    id: "macos",
    label: "macOS",
    description: "macOS 应用图标，从 16px 到 1024px 全尺寸",
    icon: <Laptop className="size-5" />,
    color: "#8b5cf6",
    assets: [
      {
        name: "1024.png",
        size: "315.2 KB",
        dimensions: "1024x1024",
        url: `${GITHUB_RAW_BASE}/macOS/1024.png`,
        usage: "App Store / Retina",
      },
      {
        name: "512.png",
        size: "105.5 KB",
        dimensions: "512x512",
        url: `${GITHUB_RAW_BASE}/macOS/512.png`,
        usage: "512pt @2x",
      },
      {
        name: "256.png",
        size: "34.4 KB",
        dimensions: "256x256",
        url: `${GITHUB_RAW_BASE}/macOS/256.png`,
        usage: "128pt @2x / 256pt",
      },
      {
        name: "128.png",
        size: "11.6 KB",
        dimensions: "128x128",
        url: `${GITHUB_RAW_BASE}/macOS/128.png`,
        usage: "128pt",
      },
      {
        name: "64.png",
        size: "4.0 KB",
        dimensions: "64x64",
        url: `${GITHUB_RAW_BASE}/macOS/64.png`,
        usage: "32pt @2x",
      },
      {
        name: "32.png",
        size: "1.4 KB",
        dimensions: "32x32",
        url: `${GITHUB_RAW_BASE}/macOS/32.png`,
        usage: "32pt / 16pt @2x",
      },
      {
        name: "16.png",
        size: "575 B",
        dimensions: "16x16",
        url: `${GITHUB_RAW_BASE}/macOS/16.png`,
        usage: "16pt",
      },
    ],
  },
  {
    id: "watchos",
    label: "watchOS",
    description: "Apple Watch 图标：Home Screen、通知、Short Look",
    icon: <Watch className="size-5" />,
    color: "#f59e0b",
    assets: [
      {
        name: "App Store.png",
        size: "315.2 KB",
        dimensions: "1024x1024",
        url: `${GITHUB_RAW_BASE}/watchOS/App%20Store.png`,
        usage: "Watch App Store",
      },
      {
        name: "Short Look.png",
        size: "19.8 KB",
        dimensions: "172x172",
        url: `${GITHUB_RAW_BASE}/watchOS/Short%20Look.png`,
        usage: "Short Look notification",
      },
      {
        name: "Home Screen.png",
        size: "6.3 KB",
        dimensions: "80x80",
        url: `${GITHUB_RAW_BASE}/watchOS/Home%20Screen.png`,
        usage: "Watch home screen",
      },
      {
        name: "Notification.png",
        size: "2.8 KB",
        dimensions: "48x48",
        url: `${GITHUB_RAW_BASE}/watchOS/Notification.png`,
        usage: "Notification center",
      },
    ],
  },
];

function IconCard({
  asset,
  categoryColor,
}: {
  asset: IconAsset;
  categoryColor: string;
}) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopyUrl = () => {
    copyToClipboard(asset.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-[var(--ide-bg-card,#0d1b2a)] border border-[var(--ide-border,#1e3a5f)] rounded-xl p-4 hover:border-[color-mix(in_srgb,var(--ide-accent,#0ea5e9)_60%,transparent)] transition-all duration-200 hover:shadow-lg hover:shadow-[color-mix(in_srgb,var(--ide-accent,#0ea5e9)_10%,transparent)]">
      {/* Preview */}
      <div
        className="flex items-center justify-center w-full h-28 mb-3 rounded-lg overflow-hidden"
        style={{
          background:
            "repeating-conic-gradient(#1a2744 0% 25%, #0d1b2a 0% 50%) 50% / 16px 16px",
        }}
      >
        {!imgError ? (
          <img
            src={asset.url}
            alt={asset.name}
            className="max-w-full max-h-full object-contain drop-shadow-lg"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-[var(--ide-text-muted,#4b6a8a)]">
            <ImageIcon className="size-8" />
            <span className="text-xs">Preview N/A</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1.5">
        <p
          className="text-sm text-[var(--ide-text,#e2e8f0)] truncate"
          title={asset.name}
        >
          {asset.name}
        </p>
        {asset.usage && (
          <p
            className="text-xs text-[var(--ide-text-muted,#4b6a8a)] truncate"
            title={asset.usage}
          >
            {asset.usage}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-[var(--ide-text-muted,#4b6a8a)]">
          {asset.dimensions && (
            <span
              className="px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `color-mix(in srgb, ${categoryColor} 15%, transparent)`,
                color: categoryColor,
              }}
            >
              {asset.dimensions}
            </span>
          )}
          <span>{asset.size}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopyUrl}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg bg-[var(--ide-bg-medium,#112240)] hover:bg-[var(--ide-bg-hover,#1a3a5c)] text-[var(--ide-text-muted,#4b6a8a)] hover:text-[var(--ide-text,#e2e8f0)] transition-colors cursor-pointer"
          title="Copy URL"
        >
          {copied ? (
            <CheckCircle2 className="size-3 text-green-400" />
          ) : (
            <Copy className="size-3" />
          )}
          {copied ? "已复制" : "复制链接"}
        </button>
        <a
          href={asset.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center p-1.5 rounded-lg bg-[var(--ide-bg-medium,#112240)] hover:bg-[var(--ide-bg-hover,#1a3a5c)] text-[var(--ide-text-muted,#4b6a8a)] hover:text-[var(--ide-text,#e2e8f0)] transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="size-3" />
        </a>
        <a
          href={asset.url}
          download={asset.name}
          className="flex items-center justify-center p-1.5 rounded-lg bg-[var(--ide-bg-medium,#112240)] hover:bg-[var(--ide-bg-hover,#1a3a5c)] text-[var(--ide-text-muted,#4b6a8a)] hover:text-[var(--ide-text,#e2e8f0)] transition-colors"
          title="Download"
        >
          <Download className="size-3" />
        </a>
      </div>
    </div>
  );
}

/** Stats bar showing total counts */
function StatsBar() {
  const totalAssets = categories.reduce((sum, c) => sum + c.assets.length, 0);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
      <div className="bg-[var(--ide-bg-card,#0d1b2a)] border border-[var(--ide-border,#1e3a5f)] rounded-xl p-4 text-center">
        <div className="text-2xl text-[var(--ide-text,#e2e8f0)]">
          {totalAssets}
        </div>
        <div className="text-xs text-[var(--ide-text-muted,#4b6a8a)] mt-1">
          总资源
        </div>
      </div>
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="bg-[var(--ide-bg-card,#0d1b2a)] border border-[var(--ide-border,#1e3a5f)] rounded-xl p-4 text-center"
        >
          <div className="text-2xl" style={{ color: cat.color }}>
            {cat.assets.length}
          </div>
          <div className="text-xs text-[var(--ide-text-muted,#4b6a8a)] mt-1">
            {cat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function IconAssetsPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredCategories =
    activeCategory === "all"
      ? categories
      : categories.filter((c) => c.id === activeCategory);

  const totalAssets = categories.reduce((sum, c) => sum + c.assets.length, 0);

  return (
    <div className="min-h-screen bg-[var(--ide-bg-deep,#060d1a)] text-[var(--ide-text,#e2e8f0)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--ide-border,#1e3a5f)] bg-[var(--ide-bg-deep,#060d1a)]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--ide-text-muted,#4b6a8a)] hover:text-[var(--ide-text,#e2e8f0)] hover:bg-[var(--ide-bg-medium,#112240)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              返回首页
            </button>
            <div className="h-6 w-px bg-[var(--ide-border,#1e3a5f)]" />
            <div>
              <h1 className="text-lg text-[var(--ide-text,#e2e8f0)] flex items-center gap-2">
                <Layers className="size-5" style={{ color: "#0ea5e9" }} />
                YYC3 Design Icons
              </h1>
              <p className="text-xs text-[var(--ide-text-muted,#4b6a8a)] mt-0.5">
                YYC3-Design-Prompt/public/yyc3 · {totalAssets} 个资源 · 5 个平台
              </p>
            </div>
          </div>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-[var(--ide-bg-medium,#112240)] hover:bg-[var(--ide-bg-hover,#1a3a5c)] text-[var(--ide-text-muted,#4b6a8a)] hover:text-[var(--ide-text,#e2e8f0)] border border-[var(--ide-border,#1e3a5f)] transition-colors"
          >
            <ExternalLink className="size-4" />
            GitHub
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <StatsBar />

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
              activeCategory === "all"
                ? "bg-[var(--ide-accent,#0ea5e9)] text-white"
                : "bg-[var(--ide-bg-card,#0d1b2a)] text-[var(--ide-text-muted,#4b6a8a)] hover:text-[var(--ide-text,#e2e8f0)] border border-[var(--ide-border,#1e3a5f)]"
            }`}
          >
            全部 ({totalAssets})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? "text-white"
                  : "bg-[var(--ide-bg-card,#0d1b2a)] text-[var(--ide-text-muted,#4b6a8a)] hover:text-[var(--ide-text,#e2e8f0)] border border-[var(--ide-border,#1e3a5f)]"
              }`}
              style={
                activeCategory === cat.id
                  ? { backgroundColor: cat.color }
                  : undefined
              }
            >
              {cat.icon}
              {cat.label} ({cat.assets.length})
            </button>
          ))}
        </div>

        {/* Content */}
        {filteredCategories.map((category) => (
          <section key={category.id} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center justify-center size-9 rounded-lg"
                style={{
                  backgroundColor: `color-mix(in srgb, ${category.color} 15%, transparent)`,
                  color: category.color,
                }}
              >
                {category.icon}
              </div>
              <div>
                <h2 className="text-base text-[var(--ide-text,#e2e8f0)]">
                  {category.label}
                </h2>
                <p className="text-xs text-[var(--ide-text-muted,#4b6a8a)]">
                  {category.description}
                </p>
              </div>
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-[var(--ide-bg-card,#0d1b2a)] text-[var(--ide-text-muted,#4b6a8a)] border border-[var(--ide-border,#1e3a5f)]">
                {category.assets.length} 个文件
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {category.assets.map((asset) => (
                <IconCard
                  key={asset.url}
                  asset={asset}
                  categoryColor={category.color}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Usage Guide */}
        <section className="mt-8 p-6 rounded-xl bg-[var(--ide-bg-card,#0d1b2a)] border border-[var(--ide-border,#1e3a5f)]">
          <h3 className="text-sm text-[var(--ide-text,#e2e8f0)] mb-4 flex items-center gap-2">
            <Monitor className="size-4 text-[#8b5cf6]" />
            使用指南
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[var(--ide-bg-deep,#060d1a)]">
              <div className="text-xs text-[#3b82f6] mb-2">Web App / PWA</div>
              <pre className="text-xs text-[var(--ide-text-muted,#4b6a8a)] whitespace-pre-wrap">{`<link rel="icon" type="image/png"
  sizes="32x32"
  href="/yyc3/favicon-32.png">
<link rel="apple-touch-icon"
  href="/yyc3/apple-touch-icon.png">`}</pre>
            </div>
            <div className="p-4 rounded-lg bg-[var(--ide-bg-deep,#060d1a)]">
              <div className="text-xs text-[#10b981] mb-2">Android</div>
              <pre className="text-xs text-[var(--ide-text-muted,#4b6a8a)] whitespace-pre-wrap">{`将对应密度 PNG 复制到：
res/mipmap-mdpi/   (48x48)
res/mipmap-hdpi/   (72x72)
res/mipmap-xhdpi/  (96x96)
res/mipmap-xxhdpi/ (144x144)
res/mipmap-xxxhdpi/(192x192)`}</pre>
            </div>
            <div className="p-4 rounded-lg bg-[var(--ide-bg-deep,#060d1a)]">
              <div className="text-xs text-[#06b6d4] mb-2">iOS / macOS</div>
              <pre className="text-xs text-[var(--ide-text-muted,#4b6a8a)] whitespace-pre-wrap">{`在 Xcode 中创建：
Assets.xcassets/
  AppIcon.appiconset/
    Contents.json
    + 各尺寸 PNG 文件`}</pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
