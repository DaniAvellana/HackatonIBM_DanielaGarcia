FROM node:18-alpine

# Definimos la carpeta de trabajo dentro del contenedor
WORKDIR /app


COPY package*.json ./

# Instalamos las dependencias dentro del contenedor
RUN npm install


COPY . .

# Le decimos a Docker que este servicio usa el puerto 3000
EXPOSE 3000

# Comando que se ejecuta cuando arranca el contenedor
CMD ["node", "index.js"]