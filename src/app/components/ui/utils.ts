/**
 * @file utils.ts
 * @description utils — ui 模块
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags module,typescript,ui
 */

/**
 * file: ui/utils.ts
 * description: UI 工具函数 - 基于 clsx 和 tailwind-merge 的 className 合并工具
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v1.0.0
 * created: 2026-03-19
 * updated: 2026-03-19
 * status: stable
 * license: MIT
 * copyright: Copyright (c) 2026 YanYuCloudCube Team
 * tags: utils,classnames,clsx,tailwind-merge
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
