require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const accountRoutes = require('./routes/accountRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.get('/health', (_req, res) => {
    res.status(200).json({ service: 'accounts-service', status: 'OK', time: new Date().toISOString() });
});

app.use('/', accountRoutes);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
    console.log(`[accounts-service] Corriendo en puerto ${PORT}`);
    console.log(`[accounts-service] BD: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

module.exports = { app, server };
