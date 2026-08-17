FROM mcr.microsoft.com/playwright:v1.49.1-noble
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p /app/data/audit-logs /app/data/audit-reports && chmod -R 777 /app/data
EXPOSE 4000
CMD ["node", "server.js"]
