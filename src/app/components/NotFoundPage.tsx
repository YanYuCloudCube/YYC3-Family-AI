/**
 * @file NotFoundPage.tsx
 * @description 404 页面，未匹配路由时展示，已完成 isCyber → useThemeTokens 迁移
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-06
 * @updated 2026-03-15
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags 404,not-found,routing,token-migrated
 */

import { useNavigate } from "react-router";
import { Home, ArrowLeft, SearchX } from "lucide-react";
import { useThemeTokens } from "./ide/hooks/useThemeTokens";

/**
 * 404 页面 — 未匹配路由时展示
 */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const t = useThemeTokens();

  return (
    <div
      className={`size-full min-h-screen flex items-center justify-center ${t.page.pageBg}`}
    >
      <div className="text-center max-w-sm mx-4">
        <div
          className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${t.btn.accent}`}
        >
          <SearchX className={`w-8 h-8 ${t.text.muted}`} />
        </div>

        <h1 className={`text-[2rem] mb-2 ${t.text.heading}`}>404</h1>
        <p className={`text-[0.85rem] mb-1 ${t.text.secondary}`}>页面未找到</p>
        <p className={`text-[0.72rem] mb-8 ${t.text.muted}`}>
          您访问的页面不存在或已被移动
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8rem] transition-colors ${t.btn.ghost} ${t.btn.ghostHover}`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回
          </button>
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8rem] transition-colors ${t.home.newProjectBtn}`}
          >
            <Home className="w-3.5 h-3.5" />
            首页
          </button>
        </div>
      </div>
    </div>
  );
}
