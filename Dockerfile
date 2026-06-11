FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 noscrape && \
    adduser --system --uid 1001 noscrape

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER noscrape

EXPOSE 3001

ENV NODE_ENV=production
ENV MCP_PORT=3001

ENTRYPOINT ["node", "dist/deployments/mcp-server.js"]
