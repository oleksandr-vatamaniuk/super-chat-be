FROM node:20-alpine AS build

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build


FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --production

COPY --from=build /app/dist ./dist
COPY .env ./

EXPOSE 8000

CMD ["node", "./dist/app.js"]