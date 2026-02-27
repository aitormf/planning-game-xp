# Plan: MCP Server Remoto para PlanningGameXP sobre Firebase Functions

## Problema

El MCP server del Planning Game es local (stdio). Solo puedo usarlo desde Claude Code CLI. Las conversaciones que tengo en claude.ai (web y móvil) no tienen acceso al Planning Game, así que tengo que repetir conversaciones en CLI para ejecutar acciones. Quiero poder usar el Planning Game directamente desde claude.ai y la app móvil de Claude.

## Solución

Crear una versión remota del MCP server que corra sobre **Firebase Functions v2**, usando **Streamable HTTP** como transporte. Así puedo añadirlo como custom connector en claude.ai (Settings > Connectors) y usarlo desde web y móvil.

## Restricciones

- **Multi-instancia**: El Planning Game se despliega como instancias independientes en distintos proyectos de Firebase. Yo tengo 2 (personal y Geniova) y puede haber más. Cada instancia tiene su propio Firebase project con su propia base de datos y Auth. El MCP server remoto se despliega POR instancia. En claude.ai se añade un connector por instancia. El código es el mismo para todas — solo cambia la configuración del Firebase project.
- **JavaScript vanilla**: No uso TypeScript. JavaScript puro, ESM modules.
- **Firebase Functions v2**: Gen2, que corre sobre Cloud Run.
- **Autenticación con OAuth 2.1**: Claude.ai como cliente MCP usa OAuth 2.1 con Dynamic Client Registration. Firebase Auth no soporta DCR nativo, así que hay que implementar un middleware OAuth sobre Firebase Auth que cumpla la spec MCP.
- **Streamable HTTP, NO SSE**: SSE requiere conexiones long-lived incompatibles con serverless y está en camino de deprecación en MCP. Streamable HTTP es request/response puro.
- **Sesiones stateless**: Las Functions son stateless, así que las sesiones MCP deben persistirse (Firestore o RTDB).

## Lo que necesito

1. Analiza el MCP server local actual del Planning Game.
2. Genera un plan de implementación para convertirlo en servidor remoto sobre Firebase Functions v2 con autenticación OAuth y transporte Streamable HTTP.
3. Crea las tareas del plan en el Planning Game usando el MCP.

## Referencias de la spec MCP

- Auth spec: https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization
- Streamable HTTP transport: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http
- Building remote MCP servers (Anthropic): https://support.claude.com/en/articles/11503834-building-custom-connectors-via-remote-mcp-servers
- Claude OAuth callback URL: `https://claude.ai/api/mcp/auth_callback`
