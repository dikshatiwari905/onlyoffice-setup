# Use Node.js official LTS image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies (production only)
#RUN npm install --production

# Install all dependencies including dev
RUN npm install


# Copy rest of the backend code
COPY . .

# Expose backend port
EXPOSE 3000

# Start the backend
CMD ["npx", "nodemon", "server.js"]

