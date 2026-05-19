
Sprint 1 — "Install → Login → Connected" (el wow moment)

Backend + Plugin en paralelo. Objetivo: 60 segundos.

Lado	Tarea
mcp-ops-db
Migración tenant_user_sessions
mcp-ops-db
Repository sessions (create, lookup, rotate)
backend
POST /signup, /login, /refresh (mínimo)
backend
Auto-provisioning: tenant + user + seed tools
backend
JWT con claims completos
mcp-ops-plugin
Scaffold: cursor-plugin.json, CI, estructura
mcp-ops-plugin
Auth UI: signup/login en settings del plugin
mcp-ops-plugin
Secure token storage
mcp-ops-plugin
Auto-configuración remote MCP (sin que el usuario toque nada)
Validación: instalo → signup → quedo conectado. Sin tocar JSON, sin copiar tokens, sin configurar transporte.

Sprint 2 — "Primer valor sin credenciales" (diagnostics)

Lado	Tarea
backend
Verificar que diagnostics funciona para public_free tenants
mcp-ops-plugin
HTTP transport funcionando, retry, reconnect, health check
mcp-ops-plugin
UX de conexión visible (conectado/desconectado)
Validación: el usuario dice "check SSL for mydomain.com" y obtiene respuesta real. Sin haber configurado nada más.

Sprint 3 — "Configure my Datadog" (onboarding conversacional)

Lado	Tarea
mcp-ops-b
ops_configure_integration con whitelist enforcement
mcp-ops-b
ops_list_integrations (valores masked)
mcp-ops-b
Subprocess restart tras cambio de credenciales
mcp-ops-plugin
UX para prompts de credenciales en chat
Validación: "configure my Datadog integration" → pega tokens → "show me recent errors" → funciona.

Sprint 4 — "Enough to love, not enough to stop upgrading"

Lado	Tarea
mcp-ops-b
ops_remove_integration, ops_test_integration
backend
Trial expiration cron
backend
Respuesta TRIAL_EXPIRED en gateway
backend
Signup throttling + rate limiting
mcp-ops-plugin
Intercepción TRIAL_EXPIRED → upgrade CTA
mcp-ops-plugin
Silent refresh flow
Validación: tras 30 días, el usuario ve mensaje de upgrade claro, no un error genérico.

Sprint 5 — "Marketplace ready"

Lado	Tarea
mcp-ops-plugin
README pulido, screenshots, GIFs
mcp-ops-plugin
INSTALL.md, TOOLS.md, TROUBLESHOOTING.md, SECURITY.md
mcp-ops-infra
WAF hardening, monitoring, ECS scaling básico
todos
Beta testing con usuarios reales
mcp-ops-plugin
Release a Marketplace
La diferencia fundamental vs. mi plan anterior:

Antes: Bloque 1 completo (toda la auth) → Bloque 2 completo (todas las tools) → Bloque 3 completo (todo el plugin) → launch
Ahora: cada sprint entrega un tramo testable del journey del usuario
Sprint 1 ya te dice si la experiencia de signup funciona. Sprint 2 ya te dice si el MCP responde. Sprint 3 ya te dice si el onboarding conversacional convence.

No necesitas esperar al final para descubrir que algo no funciona.