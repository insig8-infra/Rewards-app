# syntax=docker/dockerfile:1

FROM node:24-slim AS build

WORKDIR /app
ENV NODE_ENV=development

ARG ADMIN_WEB_API_BASE_URL
ARG NEXT_PUBLIC_API_BASE_URL
ENV ADMIN_WEB_API_BASE_URL=${ADMIN_WEB_API_BASE_URL}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages packages
COPY apps apps
RUN npm ci

RUN npm run build --workspace @volt-rewards/admin-web
RUN npm prune --omit=dev

FROM node:24-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/admin-web ./apps/admin-web

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "@volt-rewards/admin-web"]
