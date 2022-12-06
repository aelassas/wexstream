import app from './server.js';
import fs from 'fs';
import https from 'https';

const PORT = parseInt(process.env.WS_PORT) || 4000;
const HTTPS = process.env.WS_HTTPS.toLocaleLowerCase() === 'true';
const PRIVATE_KEY = process.env.WS_PRIVATE_KEY;
const CERTIFICATE = process.env.WS_CERTIFICATE;

if (HTTPS) {
    https.globalAgent.maxSockets = Infinity;
    const privateKey = fs.readFileSync(PRIVATE_KEY, 'utf8');
    const certificate = fs.readFileSync(CERTIFICATE, 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    const httpsServer = https.createServer(credentials, app);

    httpsServer.listen(PORT, () => {
        console.log('HTTPS server is running on Port:', PORT);
    });
} else {
    app.listen(PORT, () => {
        console.log('HTTPS server is running on Port:', PORT);
    });
}
