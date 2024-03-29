FROM node:20-alpine as build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

RUN pnpm install --frozen-lockfile && cd frontend && pnpm run build-only && cd .. && pnpm run build

FROM node:20-alpine

RUN npm install -g prisma@5.9.1

ENV DATABASE_URL="file:/data/sqlite.db"

WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/prisma /app/prisma
COPY --from=build /app/entrypoint.sh /app/entrypoint.sh
COPY --from=build /app/package.json /app/package.json

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD wget --spider http://localhost:4000 || exit 1

EXPOSE 4000

VOLUME [ "/data" ]

ENTRYPOINT [ "/app/entrypoint.sh" ]