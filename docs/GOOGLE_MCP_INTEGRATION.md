# Integración de Google MCP (Stitch & Developer Knowledge)

Esta guía detalla cómo configurar los servidores MCP oficiales de Google para el ecosistema Planning Game + Karajan. Estos servicios son gratuitos (Stitch en fase Beta) y proporcionan capacidades avanzadas de diseño UI y consulta de documentación técnica oficial.

## Requisitos Previos

1.  **Google Cloud Project ID**: Un proyecto activo en Google Cloud.
2.  **Google Cloud CLI (`gcloud`)**: Instalado y configurado (`gcloud auth login`).
3.  **Node.js & npx**: Para ejecutar los servidores MCP mediante `npx`.

## Configuración en Google Cloud

1.  **Habilitar APIs**:
    ```bash
    gcloud services enable stitch.googleapis.com
    gcloud services enable developerknowledge.googleapis.com
    ```
2.  **Generar API Key**:
    *   Ve a [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
    *   Crea una **API Key**.
    *   **Restricción Recomendada**: Edita la clave y restringe su uso únicamente a la "Developer Knowledge API".
3.  **Login de Aplicación**:
    ```bash
    gcloud auth application-default login
    ```

## Configuración de Servidores MCP

### Gemini CLI y Claude Desktop (`settings.json`)
Añadir al objeto `mcpServers`:

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "stitch-mcp"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "TU_PROJECT_ID"
      }
    },
    "dev-knowledge": {
      "command": "npx",
      "args": ["-y", "@google/mcp-developer-knowledge"],
      "env": {
        "GOOGLE_DEVELOPER_KNOWLEDGE_API_KEY": "TU_API_KEY"
      }
    }
  }
}
```

### Codex (`config.toml`)
Añadir al final del archivo:

```toml
[mcp_servers.stitch]
command = "npx"
args = ["-y", "stitch-mcp"]
[mcp_servers.stitch.env]
GOOGLE_CLOUD_PROJECT = "TU_PROJECT_ID"

[mcp_servers."dev-knowledge"]
command = "npx"
args = ["-y", "@google/mcp-developer-knowledge"]
[mcp_servers."dev-knowledge".env]
GOOGLE_DEVELOPER_KNOWLEDGE_API_KEY = "TU_API_KEY"
```

## Automatización para el Instalador

El instalador puede detectar el `PROJECT_ID` actual usando:
`gcloud config get-value project`

Y verificar si la API Key está configurada en las variables de entorno antes de escribir los archivos de configuración.
