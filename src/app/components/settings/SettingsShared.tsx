/**
 * @file: settings/SettingsShared.tsx
 * @description: 设置页面共享 UI 基础组件：Toggle、SettingRow、SettingGroup、SectionHeader 等
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-03-17
 * @updated: 2026-03-17
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: settings,ui,shared,components
 */

import React from "react";
import { Check } from "lucide-react";
import type { ThemeTokens } from "../ide/hooks/useThemeTokens";

/** 开关 Toggle */
export function Toggle({
  checked,
  onChange,
  t,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  t: ThemeTokens;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${
        checked ? t.page.toggleOn : t.page.toggleOff
      }`}
    >
      <div
        className={`absolute top-0.5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
        style={{ width: 18, height: 18 }}
      />
    </button>
  );
}

/** 设置分组标题 */
export function SettingGroup({
  title,
  children,
  t,
}: {
  title: string;
  children: React.ReactNode;
  t: ThemeTokens;
}) {
  return (
    <div>
      <div
        className={`text-[0.72rem] uppercase tracking-wider mb-3 ${t.text.muted}`}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

/** 单行设置项 */
export function SettingRow({
  label,
  description,
  children,
  t,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  t: ThemeTokens;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}
    >
      <div className="flex-1 min-w-0 mr-3">
        <div className={`text-[0.85rem] ${t.text.label}`}>{label}</div>
        {description && (
          <div className={`text-[0.72rem] ${t.text.caption}`}>
            {description}
          </div>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

/** 主题按钮 */
export function ThemeButton({
  icon: Icon,
  label,
  active,
  onClick,
  t,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  t: ThemeTokens;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
        active
          ? `${t.page.navActive} ${t.page.cardBorder}`
          : `${t.page.navInactive} ${t.page.cardBorder}`
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[0.85rem]">{label}</span>
      {active && <Check className="w-4 h-4 ml-auto" />}
    </button>
  );
}

/** 空状态 */
export function EmptyState({
  icon: Icon,
  message,
  t,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  t: ThemeTokens;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-10 ${t.text.muted}`}
    >
      <Icon className="w-10 h-10 mb-3 opacity-40" />
      <span className="text-[0.82rem]">{message}</span>
    </div>
  );
}

/** 可编辑列表项卡片 */
export function ItemCard({
  children,
  t,
  className = "",
}: {
  children: React.ReactNode;
  t: ThemeTokens;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 transition-all ${t.page.cardBg} ${t.page.cardBorder} ${className}`}
    >
      {children}
    </div>
  );
}
