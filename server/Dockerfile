FROM oven/bun:latest

WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD [ "bun", "run", "src/index.ts" ]
