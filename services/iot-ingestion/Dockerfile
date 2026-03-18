FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/validators/package.json ./packages/validators/
COPY services/iot-ingestion/package.json ./services/iot-ingestion/
RUN npm install --workspace=services/iot-ingestion --workspace=packages/shared-types --workspace=packages/validators

COPY packages/shared-types/ ./packages/shared-types/
COPY packages/validators/ ./packages/validators/
COPY services/iot-ingestion/ ./services/iot-ingestion/
COPY tsconfig.base.json ./

RUN npm run build --workspace=packages/shared-types && \
    npm run build --workspace=packages/validators && \
    npm run build --workspace=services/iot-ingestion

CMD ["node", "services/iot-ingestion/dist/index.js"]
