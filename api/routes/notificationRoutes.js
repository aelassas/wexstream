import express from 'express';
import routeNames from '../config/notificationRoutes.config.js';
import authJwt from '../middlewares/authJwt.js';
import * as notificationController from '../controllers/notificationController.js';

const routes = express.Router();

routes.route(routeNames.notify).post(authJwt.verifyToken, notificationController.notify);
routes.route(routeNames.approve).post(authJwt.verifyToken, notificationController.approve);
routes.route(routeNames.decline).post(authJwt.verifyToken, notificationController.decline);
routes.route(routeNames.getNotifications).get(authJwt.verifyToken, notificationController.getNotifications);
routes.route(routeNames.getNotification).get(authJwt.verifyToken, notificationController.getNotification);
routes.route(routeNames.markAsRead).post(authJwt.verifyToken, notificationController.markAsRead);
routes.route(routeNames.markAllAsRead).post(authJwt.verifyToken, notificationController.markAllAsRead);
routes.route(routeNames.markAsUnRead).post(authJwt.verifyToken, notificationController.markAsUnRead);
routes.route(routeNames.delete).delete(authJwt.verifyToken, notificationController.deleteNotification);
routes.route(routeNames.deleteAll).delete(authJwt.verifyToken, notificationController.deleteAll);
routes.route(routeNames.notificationCounter).get(authJwt.verifyToken, notificationController.getNotificationCounter);

export default routes;