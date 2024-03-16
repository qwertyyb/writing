FROM node:20-alpine as build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

RUN pnpm install --frozen-lockfile && cd frontend && pnpm run build-only && cd .. && pnpx prisma migrate deploy && pnpm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/data /app/data

EXPOSE 4000

CMD [ "node", "dist/index.js" ]