# syntax=docker/dockerfile:1

FROM node:24-slim AS build

WORKDIR /app
ENV NODE_ENV=development

ARG EXPO_PUBLIC_API_BASE_URL
ENV EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL}

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages packages
COPY apps apps
RUN npm ci

RUN npm run export:web --workspace @volt-rewards/mobile

FROM node:24-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV STATIC_ROOT=/app/dist

COPY tools/serve-static.mjs ./tools/serve-static.mjs
COPY --from=build /app/apps/mobile/dist ./dist

EXPOSE 3000

CMD ["node", "tools/serve-static.mjs"]
