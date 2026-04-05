# Build frontend
# set Envarment
FROM node:20-alpine as frontend-builder

COPY ./frontend /app

WORKDIR /app

RUN npm install && npm run build

#Build backend
FROM node:20-alpine as backend-builder

COPY ./Backend /app

WORKDIR /app

RUN npm install

COPY --from=frontend-builder /app/dist ./public

CMD ["node","server.js"]