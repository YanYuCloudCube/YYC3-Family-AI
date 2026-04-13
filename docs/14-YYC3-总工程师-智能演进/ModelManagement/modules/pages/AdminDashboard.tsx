/**
 * @file pages/AdminDashboard.tsx
 * @description 管理后台 - 嵌入设置模块
 */

import { SettingsOrchestrator } from "../orchestrator/SettingsOrchestrator";

export function AdminDashboard() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      
      <main>
        <AdminHeader />
        
        <section className="settings-section">
          <SettingsOrchestrator
            modules={["users", "permissions", "audit"]}
            title="系统管理"
            layout="accordion"
          />
        </section>
      </main>
    </div>
  );
}