# Use a Node base image
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Copy dependency manifests first for caching
COPY package*.json ./

# Install dependencies (including ts-node & typescript if needed)
RUN npm install

# Copy the rest of your source code
COPY . .

# Compile TypeScript -> JavaScript
RUN npx tsc

# Expose the port the app listens on
EXPOSE 3000

# Run the compiled JS
CMD ["node", "dist/index.js"]