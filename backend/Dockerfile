FROM node:20-alpine

WORKDIR /app

# Copy package manifests
COPY package.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy prisma schema & generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
