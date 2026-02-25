FROM node:18-alpine

WORKDIR /app

# Copy MCP package.json and install dependencies
COPY mcp/package.json mcp/package-lock.json* ./mcp/
RUN cd mcp && npm ci --omit=dev

# Copy MCP source code
COPY mcp/*.js ./mcp/
COPY mcp/tools/ ./mcp/tools/
COPY mcp/services/ ./mcp/services/

# Copy shared modules (imported by MCP as ../../shared/)
COPY shared/*.js ./shared/

# serviceAccountKey.json and mcp.user.json are mounted as volumes, NOT baked in

ENTRYPOINT ["node", "mcp/index.js"]
