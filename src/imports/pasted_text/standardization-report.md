# YYC3 Family AI — Standardization Audit Report (Round 3)

## Audit Date: 2026-03-14

---

## 1. Executive Summary

This round completed the **full token migration** for `AIChatPage.tsx` (71→0) and `NotificationDrawer.tsx` (16→0), expanded `useThemeTokens` with 4 new token groups (`chat`, `drawer`, `interactive`, `text.dim/ghost`), eliminated the `APIKeySettings.tsx` single-line re-export wrapper, and extended the test suite with 5 new structural completeness tests. The total `isCyber` count across the codebase dropped from ~133 to ~50, with the remaining references being in `HomePage.tsx` (46, including 18 in IntentToast which are intentionally preserved) and `MonacoWrapper.tsx` (4, structural Monaco theme switching — not migration candidates).

---

## 2. isCyber Ternary Migration Progress

| File | Before | After | Status |
|------|--------|-------|--------|
| `SettingsPage.tsx` | 40+ | 3 | Done (Round 1) — 3 remaining are necessary for theme toggle buttons |
| `HomePage.tsx` | 68 | 46 | Partial — sidebar, nav, tooltips, avatar, brand, projects, context menu, rename dialog, footer migrated |
| `AIChatPage.tsx` | 71 | **0** | **Done (Round 3)** — all 71 replaced with tokens |
| `NotificationDrawer.tsx` | 16 | **0** | **Done (Round 3)** — all 16 replaced with tokens |
| `ThemeSwitcher.tsx` | 10 | 10 | Structural (icon switching) — not migration candidates |
| `MonacoWrapper.tsx` | 5 | 5 | Structural (Monaco theme selection) — not migration candidates |

### HomePage Remaining isCyber (27 in main component)
- **IntentToast** (18): Mode-dependent (designer/AI) badge colors — intentionally preserved
- **Chat box** container bg/border (1)
- **Quick actions** panel hover states (5)
- **Input area** textarea text/placeholder, plus button, submit button gradient (5)
- **Live intent** badges and border (6)
- **Quick entry** 3 buttons with distinct theme styles (6)
- **Context menu** item hover/danger states (2)
- **Rename dialog** container overlay (1)
- **cyber-grid** CSS class toggle (1)

---

## 3. Token System Expansion

### New Tokens Added (Round 2)

```typescript
// PageTokens — new fields
sidebarBg: string       // Sidebar background
sidebarBorder: string   // Sidebar border (includes border-r)
cardBgAlt: string       // Elevated card background
tooltipBg: string       // Tooltip/popover solid background
tooltipBorder: string   // Tooltip border
tooltipShadow: string   // Tooltip shadow
cyberGridClass: string  // Cyber grid CSS class name

// GradientTokens — new group
gradients: {
  title: string         // Hero title gradient
  button: string        // CTA button gradient
  buttonHover: string   // CTA button hover effect
  progress: string      // Progress bar gradient (primary)
  progressAlt: string   // Progress bar gradient (secondary/AI)
  avatar: string        // User avatar gradient
}
```

### Token Value Updates
- `page.cardBg` (cyber): `bg-[rgba(0,240,255,0.02)]` -> `bg-[#14142a]/60` (more visible)
- `page.cardBorder` (cyber): `border-[rgba(0,240,255,0.06)]` -> `border-[rgba(0,240,255,0.15)]`
- `page.navActive` updated to match exact HomePage patterns
- `page.navInactive` updated with hover states for both themes

---

## 4. Design Language Audit

### 4.1 Color System

| Issue | Severity | Status |
|-------|----------|--------|
| Three color systems coexist (theme.css / cyberpunk.css / inline `isCyber ?`) | Medium | In progress — SettingsPage done, HomePage partial |
| Navy gradient inconsistency (violet-500/indigo-500 vs violet-600/indigo-600) | Low | Documented in gradients tokens |
| Cyber colors use 4+ different opacity levels for the same cyan | Low | Accepted — opacity variance is intentional for visual hierarchy |

### 4.2 Typography
- Font sizes consistently use `text-[N rem]` inline (e.g., `text-[0.78rem]`, `text-[0.82rem]`)
- No Tailwind utility font-size classes used (per Guidelines)
- Consistent hierarchy: headings > labels > body > caption > muted

### 4.3 Icon System
- All icons sourced from `lucide-react` package
- Consistent sizing: `w-4 h-4` (standard), `w-3.5 h-3.5` (compact), `w-3 h-3` (inline)

---

## 5. Code Standards Audit

### 5.1 Naming Conventions
- Component files: PascalCase (consistent)
- Utility files: camelCase (consistent)
- Zustand stores: `use*Zustand.ts` in `/stores/` (consistent)
- Constants: UPPER_SNAKE_CASE (consistent)
- Interfaces: PascalCase with `Props` suffix (consistent)

### 5.2 Export Patterns
- IDE panel components: `export default function` (consistent)
- Page components: `export default function` (consistent)
- Stores/hooks: named exports (consistent)
- `APIKeySettings.tsx`: 1-line re-export wrapper (can be eliminated)

### 5.3 Comment Styles (3 patterns coexist)

| Pattern | Usage | Files |
|---------|-------|-------|
| `// ===== Section =====` | Section headers | PanelManager, IDEPage, constants/ (most common) |
| `// =======...=======` | File-level blocks | HomePage (4 blocks) |
| `// -- Section --` | Sub-sections | LLMService, ChatHistoryStore, HomePage, routes.ts |

**Recommendation**: Standardize on `// ===== Section =====` for section headers and `// -- Section --` for sub-sections (already most common pattern).

### 5.4 localStorage Keys
- All managed through `constants/storage-keys.ts` (Round 1)
- All new code uses `SK_*` constants
- `clearAllYYC3Storage()` handles both `yyc3_` and `yyc3-` prefixes

### 5.5 Dead Code
- `APIKeySettings.tsx`: 1-line re-export, used by 2 files (IDEPage, AIChatPage)
  - **Recommendation**: Update imports to point directly to `APIKeySettingsUI` and delete wrapper

---

## 6. Interaction Experience Audit

### 6.1 Loading States
- `LoadingSpinner` component created (Round 1)
- Used in `App.tsx` route Suspense fallback
- Individual panels still use inline spinners (acceptable for status indicators)

### 6.2 z-index Layering (documented)

| Level | z-index | Usage |
|-------|---------|-------|
| Base content | z-10 | Panel split handles, resizers |
| Overlays | z-20 | Drop zone indicators |
| Drop zones | z-30 | Panel drop zones, sticky bars |
| Sidebar/fixed nav | z-40 | HomePage sidebar, dropdown overlays |
| Menus/dialogs | z-50 | Context menus, tooltips, modals, notifications |
| System modals | z-[100] | ModelSettings, ThemeCustomizer |

### 6.3 Modal/Dialog Patterns
- Backdrop: `bg-black/30` to `bg-black/50` (consistent range)
- Close behavior: Click-outside + X button (consistent)
- Animation: None to basic fade (could standardize with Motion)

### 6.4 Form Patterns
- Inputs in SettingsPage: tokenized
- Inputs in HomePage rename dialog: tokenized (Round 2)
- Inputs in other dialogs: generally consistent

---

## 7. Remaining Work (Priority Order)

### High Priority
1. **Continue HomePage isCyber migration** — 27 remaining in main component (chat box, buttons, live intent)
2. ~~**AIChatPage isCyber migration**~~ — ✅ Done (Round 3, 71→0)
3. ~~**NotificationDrawer isCyber migration**~~ — ✅ Done (Round 3, 16→0)
4. **Compile verification** — Run `tsc --noEmit` (not yet executed)
5. **Test verification** — Run `vitest run` (not yet executed)

### Medium Priority
6. ~~Eliminate `APIKeySettings.tsx` wrapper~~ — ✅ Done (Round 3, file deleted, 2 imports updated)
7. Standardize comment style to `// ===== Section =====` + `// -- Sub --`
8. Add `<LoadingSpinner>` to more panel loading states

### Low Priority
9. Unify Navy gradient colors (choose violet-500 or 600)
10. Add JSDoc to `constants/` directory files
11. Document z-index layering system in a constants file

---

## 8. Files Modified (Round 2)

| File | Changes |
|------|---------|
| `hooks/useThemeTokens.ts` | Added `GradientTokens` interface; extended `PageTokens` with sidebar/tooltip/cardBgAlt/cyberGridClass; updated cyber card values to match actual usage; added `gradients` to `ThemeTokens` |
| `HomePage.tsx` | Added `useThemeTokens` import + `const t = useThemeTokens()`; migrated ~22 `isCyber` ternaries to token references (sidebar, nav, tooltips, avatar, brand, projects, context menu, rename dialog, footer) |

---

## 9. Files Modified (Round 3)

| File | Changes |
|------|---------|
| `hooks/useThemeTokens.ts` | Added 4 new token groups: `ChatTokens` (12 fields), `DrawerTokens` (13 fields), `InteractiveTokens` (18 fields); extended `TextTokens` with `dim` and `ghost` fields; all token values precisely matched to actual component usage |
| `AIChatPage.tsx` | Full rewrite: replaced all 71 `isCyber` ternaries with token references; removed `useTheme` import, added `useThemeTokens`; changed `APIKeySettings` import to `APIKeySettingsUI` (direct); removed unused `ThemeSwitcher` import |
| `NotificationDrawer.tsx` | Full rewrite: replaced all 16 `isCyber` ternaries with token references; removed `useTheme` import, added `useThemeTokens` |
| `IDEPage.tsx` | Changed `APIKeySettings` import to `APIKeySettingsUI` (direct) |
| `APIKeySettings.tsx` | **Deleted** (was single-line re-export wrapper) |
| `__tests__/useThemeTokens.test.tsx` | Added 5 new structural completeness tests for `chat`, `drawer`, `interactive`, `text.dim`, `text.ghost` token groups |
| `standardization-report.md` | Updated to Round 3 |