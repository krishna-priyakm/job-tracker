FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# prisma.config.ts needs DATABASE_URL to exist, but generate never connects to a database
ARG DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobtracker"
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]