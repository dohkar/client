FROM node:22-bookworm-slim

WORKDIR /frontend

COPY package*.json ./

RUN npm ci --no-audit --no-fund

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]