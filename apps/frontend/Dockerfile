FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

ENV HUSKY=0
RUN npm ci --workspace=frontend --include-workspace-root

COPY apps/frontend apps/frontend

WORKDIR /app/apps/frontend

EXPOSE 3000

CMD ["npm", "run", "dev"]
