import express from 'express'
import routeNames from '../config/connectionRoutes.config.js'
import authJwt from '../middlewares/authJwt.js'
import * as connectionController from '../controllers/connectionController.js'

const routes = express.Router()

routes.route(routeNames.connect).post(authJwt.verifyToken, connectionController.connect)
routes.route(routeNames.get).get(authJwt.verifyToken, connectionController.get)
routes.route(routeNames.getConnectionIds).get(authJwt.verifyToken, connectionController.getConnectionIds)
routes.route(routeNames.delete).delete(authJwt.verifyToken, connectionController.deleteConnection)
routes.route(routeNames.getConnection).get(authJwt.verifyToken, connectionController.getConnection)
routes.route(routeNames.getConnections).get(authJwt.verifyToken, connectionController.getConnections)

export default routes