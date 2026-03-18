FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/megaliter-ops/package.json ./apps/megaliter-ops/
RUN npm install --workspace=apps/megaliter-ops --workspace=packages/shared-types

COPY packages/shared-types/ ./packages/shared-types/
COPY apps/megaliter-ops/ ./apps/megaliter-ops/
COPY tsconfig.base.json ./

RUN npm run build --workspace=packages/shared-types && \
    npm run build --workspace=apps/megaliter-ops

FROM nginx:alpine
COPY --from=build /app/apps/megaliter-ops/dist /usr/share/nginx/html
COPY apps/megaliter-ops/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
