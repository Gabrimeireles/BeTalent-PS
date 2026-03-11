FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3333

CMD ["node", "ace", "serve", "--host=0.0.0.0", "--port=3333"]
