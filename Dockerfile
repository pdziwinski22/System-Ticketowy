# ===== 1. baza – instalacja depsów =====
FROM node:20-alpine AS deps
WORKDIR /app

# zainstaluj narzędzia potrzebne do builda (opcjonalnie)
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json* ./ 
# jeśli używasz pnpm/yarn, dostosuj powyższą linijkę

RUN npm ci

# ===== 2. build aplikacji =====
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# produkcyjny build Next.js
ENV NODE_ENV=production

RUN npm run build

# ===== 3. finalny image – tylko runtime =====
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0


COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.mjs ./next.config.mjs 2>/dev/null || true
COPY --from=builder /app/next.config.js ./next.config.js 2>/dev/null || true

EXPOSE 3000

CMD ["npm", "start"]
