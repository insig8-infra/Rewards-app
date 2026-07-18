# syntax=docker/dockerfile:1

FROM node:24-slim AS build

WORKDIR /app
ENV NODE_ENV=development

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages packages
COPY apps apps
RUN npm ci

RUN npm run build --workspace @volt-rewards/api
RUN npm prune --omit=dev

FROM node:24-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/domain/package.json ./packages/domain/package.json
COPY --from=build /app/packages/domain/dist ./packages/domain/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "@volt-rewards/api"]
