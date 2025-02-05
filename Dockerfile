# ビルドステージ
FROM node:20-alpine3.20 as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx prisma db push
RUN npx prisma db seed
RUN npm run build

# 実行ステージ
FROM node:20-alpine3.20
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma/ollama4team.db /app/prisma/ollama4team.db
ENV NODE_ENV production
CMD ["npm", "run", "start"]
