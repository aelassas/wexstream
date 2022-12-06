import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import compression from 'compression';
import helmet from 'helmet';
import nocache from 'nocache';
import strings from './config/app.config.js';
import userRoutes from './routes/userRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import conferenceRoutes from './routes/conferenceRoutes.js';
import timelineRoutes from './routes/timelineRoutes.js';
import reportedUserRoutes from './routes/reportedUserRoutes.js';
import blockedUserRoutes from './routes/blockedUserRoutes.js';

const DB_HOST = process.env.WS_DB_HOST;
const DB_PORT = process.env.WS_DB_PORT;
const DB_SSL = process.env.WS_DB_SSL.toLowerCase() === 'true';
const DB_SSL_KEY = process.env.WS_DB_SSL_KEY;
const DB_SSL_CERT = process.env.WS_DB_SSL_CERT;
const DB_SSL_CA = process.env.WS_DB_SSL_CA;
const DB_DEBUG = process.env.WS_DB_DEBUG.toLowerCase() === 'true';
const DB_AUTH_SOURCE = process.env.WS_DB_AUTH_SOURCE;
const DB_USERNAME = process.env.WS_DB_USERNAME;
const DB_PASSWORD = process.env.WS_DB_PASSWORD;
const DB_APP_NAME = process.env.WS_DB_APP_NAME;
const DB_NAME = process.env.WS_DB_NAME;
const DB_URI = `mongodb://${encodeURIComponent(DB_USERNAME)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=${DB_AUTH_SOURCE}&appName=${DB_APP_NAME}`;

let options = {};
if (DB_SSL) {
    options = {
        ssl: true,
        sslValidate: true,
        sslKey: DB_SSL_KEY,
        sslCert: DB_SSL_CERT,
        sslCA: [DB_SSL_CA]
    };
}

mongoose.set('debug', DB_DEBUG);
mongoose.Promise = global.Promise;
mongoose.connect(DB_URI, options)
    .then(
        () => { console.log('Database is connected') },
        err => { console.error('Cannot connect to the database:', err) }
    );

const app = express();
app.use(helmet.contentSecurityPolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.crossOriginEmbedderPolicy());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());
app.use(helmet.originAgentCluster());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(helmet.crossOriginOpenerPolicy());
app.use(nocache());
app.use(compression({ threshold: 0 }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use('/', userRoutes);
app.use('/', connectionRoutes);
app.use('/', notificationRoutes);
app.use('/', messageRoutes);
app.use('/', conferenceRoutes);
app.use('/', timelineRoutes);
app.use('/', reportedUserRoutes);
app.use('/', blockedUserRoutes);

strings.setLanguage(process.env.WS_DEFAULT_LANGUAGE);

export default app;