# Etapa 1: Construcción
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor web (Nginx)
FROM nginx:alpine

# Copiamos la configuración personalizada de Nginx para manejar rutas de Angular
COPY nginx.conf /etc/nginx/conf.d/default.conf

# IMPORTANTE: Revisa si tu build genera 'dist/billing-v4-front' 
# o 'dist/billing-v4-front/browser'. En Angular 17+ suele ser la segunda.
COPY --from=build /app/dist/billing-v4-front/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]