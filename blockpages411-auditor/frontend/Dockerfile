FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_BASE=http://localhost:4000
ARG VITE_ENABLE_ADMIN_PANEL=false
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_ENABLE_ADMIN_PANEL=$VITE_ENABLE_ADMIN_PANEL
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
