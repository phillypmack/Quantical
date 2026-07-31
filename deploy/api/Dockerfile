FROM node:22-alpine

WORKDIR /app

# As dependências primeiro, para o cache de camada sobreviver a mudança no
# código do servidor — que é o que mais muda.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY server.mjs schema.sql ./

# O node:alpine já traz o usuário `node`. Rodar como root aqui não traria
# nenhuma vantagem e ampliaria o estrago de qualquer falha.
USER node

ENV NODE_ENV=production
EXPOSE 6002

# Sem shell no meio: assim o SIGTERM do Docker chega ao Node e o desligamento
# gracioso do server.mjs realmente acontece.
CMD ["node", "server.mjs"]
