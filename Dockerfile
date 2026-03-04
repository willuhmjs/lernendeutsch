FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN pnpm dlx prisma generate

# Build the application
RUN pnpm run build

# Start a new stage for a smaller image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install pnpm and tsx for potential runtime needs (optional, could just run node build)
RUN npm install -g pnpm tsx

# Copy only production dependencies and built app from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy the built app and prisma schema
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Generate Prisma client
RUN pnpm dlx prisma generate

# Expose port
EXPOSE 3000

# Set node environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD npx prisma db push --accept-data-loss && tsx prisma/seed.ts && node build/index.js
