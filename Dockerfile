FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN npm install -g pnpm@11.25.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_SITE_URL
RUN pnpm build

FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=build /app/dist/client ./dist/client
COPY scripts/railway-static.mjs ./scripts/railway-static.mjs
ENV PORT=8787
EXPOSE 8787
CMD ["node", "scripts/railway-static.mjs"]
