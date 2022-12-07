import express from 'express';
import routeNames from '../config/timelineRoutes.config.js';
import authJwt from '../middlewares/authJwt.js';
import * as timelineController from '../controllers/timelineController.js';

const routes = express.Router();

routes.route(routeNames.create).post(authJwt.verifyToken, timelineController.create);
routes.route(routeNames.deleteSpeakerEntries).delete(authJwt.verifyToken, timelineController.deleteSpeakerEntries);
routes.route(routeNames.deleteSubscriberEntry).delete(authJwt.verifyToken, timelineController.deleteSubscriberEntry);
routes.route(routeNames.getEntries).get(authJwt.verifyToken, timelineController.getEntries);

export default routes;