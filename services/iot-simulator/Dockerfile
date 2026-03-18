FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
COPY services/iot-simulator/package.json ./services/iot-simulator/
RUN npm install --workspace=services/iot-simulator

COPY services/iot-simulator/ ./services/iot-simulator/
COPY tsconfig.base.json ./

RUN npm run build --workspace=services/iot-simulator

CMD ["node", "services/iot-simulator/dist/index.js"]
