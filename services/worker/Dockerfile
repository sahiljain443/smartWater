FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY services/worker/package.json ./services/worker/
RUN npm install --workspace=services/worker --workspace=packages/shared-types

COPY packages/shared-types/ ./packages/shared-types/
COPY services/worker/ ./services/worker/
COPY tsconfig.base.json ./

RUN npm run build --workspace=packages/shared-types && \
    npm run build --workspace=services/worker

CMD ["node", "services/worker/dist/index.js"]
