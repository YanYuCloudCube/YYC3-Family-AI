# YYC³ 变量-配置参数

> @source: GitHub YYC-Cube/YanYuCloud/YYC3-Design-Prompt/变量词库/
> @version: v1.0.0 | @status: stable

## 关键配置参数变量

| 分类 | 变量名 | 默认值 |
|------|--------|--------|
| 应用 | `{{APP_NAME}}` | YYC³ AI Code |
| 服务器 | `{{SERVER_PORT}}` | 3201 |
| API | `{{API_BASE_URL}}` | http://localhost:3201/api |
| API | `{{API_TIMEOUT}}` | 30000 |
| WebSocket | `{{WS_URL}}` | ws://localhost:3201 |
| 数据库 | `{{DB_TYPE}}` | indexeddb |
| 数据库 | `{{DB_NAME}}` | yyc3-ai-code |
| 存储 | `{{STORAGE_AUTO_SAVE_INTERVAL}}` | 30000 |
| 编辑器 | `{{EDITOR_FONT_SIZE}}` | 14 |
| 编辑器 | `{{EDITOR_TAB_SIZE}}` | 2 |
| AI | `{{AI_DEFAULT_PROVIDER}}` | openai |
| AI | `{{AI_DEFAULT_MODEL}}` | gpt-4 |
| AI | `{{AI_TEMPERATURE}}` | 0.7 |
| AI | `{{AI_MAX_TOKENS}}` | 4096 |
| 性能 | `{{PERF_DEBOUNCE_DELAY}}` | 300 |
| 安全 | `{{SECURITY_ENCRYPTION_ALGORITHM}}` | AES-GCM |
| UI | `{{UI_THEME}}` | dark |
| UI | `{{UI_LANGUAGE}}` | zh-CN |

完整内容含 13 大分类 60+ 配置变量、代码使用示例、.env 模板。

原始文件: https://github.com/YanYuCloudCube/YanYuCloud/blob/main/YYC3-Design-Prompt/变量词库/YYC3-变量-配置参数.md
