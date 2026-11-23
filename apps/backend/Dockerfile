FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

ENV HUSKY=0
RUN npm ci --workspace=backend --include-workspace-root

COPY apps/backend apps/backend

WORKDIR /app/apps/backend

RUN npx prisma generate
RUN chmod +x docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
