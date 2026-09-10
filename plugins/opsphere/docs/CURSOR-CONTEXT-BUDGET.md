# Presupuesto de reglas de Cursor

## Diagnóstico de referencia

La captura del 8 de septiembre de 2026 muestra 119,2K tokens usados de una ventana
de 200K. `Rules` aporta 71,9K (60,3% de lo usado y 36,0% de toda la ventana), muy por
encima de tools (9,6K), skills (4,5K) y MCP dinámico (3,1K).

La inspección local encontró dos costes evitables:

- La regla CGC de cada repo tenía 789 palabras y `alwaysApply: true`. En un workspace
  con diez raíces podía aportar diez copias.
- `rules/onboarding-guide.mdc` tenía 4.735 palabras y `alwaysApply: true`, aunque la
  mayoría de conversaciones no configura ni opera Opsphere.
- `mcp-ops-web-public/.cursor/rules/project-context.mdc` repetía un resumen de
  `AGENTS.md`, que ya es la fuente autoritativa.

La cifra total de la captura no puede proceder solo de estos archivos: incluye reglas
del Team/curso administradas por Cursor. Su contenido no está en los checkouts locales.

## Diseño aplicado

- Siempre activo: solo un router CGC de 73 palabras y un router Opsphere breve.
- Carga inteligente: estrategia estructural CGC y onboarding operativo Opsphere, con
  descripciones que delimitan cuándo aplican.
- Carga manual: diagnóstico y recuperación de CGC.
- Eliminado: resumen de proyecto duplicado en web pública.
- `sessionStart`: contexto vacío cuando todos los repos están `READY`.
- MCP CGC: cuatro schemas expuestos; las tools internas de mutación no llegan al modelo.

## Auditoría del Team

En Cursor, expandir `Rules` en Context Usage y registrar por regla: nombre, propietario,
tokens, `alwaysApply`, alcance y solapamiento. Para cada regla del Team:

1. Mantener `Always` únicamente para seguridad, cumplimiento o una invariante universal
   que cambie la respuesta en casi todos los turnos.
2. Usar `Apply Intelligently` con una descripción concreta para dominio, framework,
   workflow o tipo de archivo.
3. Usar globs para reglas deterministas de archivos y `Manual` para runbooks raros.
4. Fusionar duplicados entre Team, plugin, `AGENTS.md` y reglas de proyecto.
5. Sustituir catálogos extensos por un router; las tools disponibles ya describen su
   contrato y la guía detallada puede cargarse bajo demanda.

Objetivo inicial: reglas siempre cargadas por debajo de 10K tokens en una conversación
normal y ninguna regla individual por encima de 2K salvo obligación justificada.
Comparar una conversación nueva antes/después; las conversaciones existentes conservan
el contexto ya ensamblado.
