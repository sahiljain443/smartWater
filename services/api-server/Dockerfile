FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies for the full monorepo (needed for workspaces)
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/validators/package.json ./packages/validators/
COPY services/api-server/package.json ./services/api-server/
RUN npm install --workspace=services/api-server --workspace=packages/shared-types --workspace=packages/validators

# Copy source
COPY packages/shared-types/ ./packages/shared-types/
COPY packages/validators/ ./packages/validators/
COPY services/api-server/ ./services/api-server/
COPY tsconfig.base.json ./

# Build
RUN npm run build --workspace=packages/shared-types && \
    npm run build --workspace=packages/validators && \
    npm run build --workspace=services/api-server

EXPOSE 3001
CMD ["node", "services/api-server/dist/index.js"]
