require('dotenv').config();

const express        = require('express');
const cors           = require('cors');
const transferRoutes = require('./routes/transferRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.get('/health', (_req, res) => {
    res.status(200).json({
        service: 'processor-service',
        status:  'OK',
        accounts_service_url: process.env.ACCOUNTS_SERVICE_URL,
        time: new Date().toISOString(),
    });
});

app.use('/', transferRoutes);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
    console.log(`[processor-service] Corriendo en puerto ${PORT}`);
    console.log(`[processor-service] Accounts Service URL: ${process.env.ACCOUNTS_SERVICE_URL || 'http://localhost:3000'}`);
});

module.exports = { app, server };
