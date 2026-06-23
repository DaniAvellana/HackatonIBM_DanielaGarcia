# Usamos Node.js para construir el proyecto React
FROM node:20-alpine AS build

# Carpeta de trabajo
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos todo el código
COPY . .

# Construimos el proyecto para producción
RUN npm run build

# Usamos Nginx para servir el frontend construido
FROM nginx:alpine

# Copiamos los archivos construidos al servidor Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80

# Nginx arranca automáticamente
CMD ["nginx", "-g", "daemon off;"]