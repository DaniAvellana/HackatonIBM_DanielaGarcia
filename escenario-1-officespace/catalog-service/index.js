//Importacion de paquetes
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


dotenv.config();


const app = express();
app.use(cors());      
app.use(express.json());


const spacesRoutes = require('./src/routes/spacesRoutes');
const authRoutes = require('./src/routes/authRoutes');


app.use('/spaces', spacesRoutes);
app.use('/auth', authRoutes);


const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Catalog Service API',
      version: '1.0.0',
      description: 'API para gestión de espacios de OfficeSpace'
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log(`Catalog Service corriendo en puerto ${PORT}`);
  console.log(`Documentación en http://localhost:${PORT}/api-docs`);
});