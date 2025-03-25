# To use this Dockerfile, you have to set `output: 'standalone'` in your next.config.mjs file.
# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "start"]
