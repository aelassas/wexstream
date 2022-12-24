import express from 'express'
import routeNames from '../config/messageRoutes.config.js'
import authJwt from '../middlewares/authJwt.js'
import * as messageController from '../controllers/messageController.js'

const routes = express.Router()

routes.route(routeNames.send).post(authJwt.verifyToken, messageController.send)
routes.route(routeNames.getMessages).get(authJwt.verifyToken, messageController.getMessages)
routes.route(routeNames.getMessage).get(authJwt.verifyToken,messageController.getMessage )
routes.route(routeNames.markAsRead).post(authJwt.verifyToken, messageController.markAsRead)
routes.route(routeNames.markAsUnread).post(authJwt.verifyToken, messageController.markAsUnread)
routes.route(routeNames.delete).delete(authJwt.verifyToken,messageController.deleteMessage )
routes.route(routeNames.messageCounter).get(authJwt.verifyToken,messageController.getMessageCounter)

export default routes