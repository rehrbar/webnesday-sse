FROM docker.io/oven/bun:1.3-alpine
WORKDIR /app
COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --no-cache --production

COPY . .
CMD ["bun", "run", "src/server.ts"]