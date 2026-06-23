# Imagen base: Node.js 20 en variante ligera Alpine
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero los archivos de dependencias
# (separado del código para aprovechar caché de Docker)
COPY package*.json ./

# Instalamos solo dependencias de producción
RUN npm install --omit=dev

# Copiamos el resto del código fuente
COPY . .

# Puerto que expone el servicio
EXPOSE 3000

# Comando que se ejecuta al iniciar el contenedor
CMD ["node", "src/index.js"]
