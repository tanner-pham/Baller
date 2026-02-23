FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npx playwright install --with-deps chromium
RUN npm run build

ENV NODE_ENV=production
EXPOSE 4010

CMD ["npm", "run", "start:api"]
