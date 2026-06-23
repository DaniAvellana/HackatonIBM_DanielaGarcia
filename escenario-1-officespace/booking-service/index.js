// Importamos los paquetes
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Cargamos las variables secretas del archivo .env
dotenv.config();

// Creamos la aplicación Express
const app = express();
app.use(cors());
// Le decimos al servidor que entienda JSON
app.use(express.json());

// Importamos las rutas de reservas
const bookingRoutes = require('./src/routes/bookingRoutes');

// Le decimos al servidor que use esas rutas
app.use('/bookings', bookingRoutes);

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Booking Service API',
      version: '1.0.0',
      description: 'API para gestión de reservas de OfficeSpace'
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Puerto del servidor (3001 para no chocar con catalog-service)
const PORT = process.env.PORT || 3001;

// Arrancamos el servidor
app.listen(PORT, () => {
  console.log(`Booking Service corriendo en puerto ${PORT}`);
  console.log(`Documentación en http://localhost:${PORT}/api-docs`);
});