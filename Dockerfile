FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY frontend ./frontend
COPY backend ./backend

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
