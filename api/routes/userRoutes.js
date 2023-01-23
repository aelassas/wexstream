import express from 'express'
import routeNames from '../config/userRoutes.config.js'
import authJwt from '../middlewares/authJwt.js'
import multer from 'multer'
import * as userController from '../controllers/userController.js'

const routes = express.Router()

routes.route(routeNames.googleAuth).post(userController.googleAuth)
routes.route(routeNames.facebookAuth).post(userController.facebookAuth)
routes.route(routeNames.signin).post(userController.signin)
routes.route(routeNames.validateAccessToken).post(authJwt.verifyToken, userController.validateAccessToken)
routes.route(routeNames.signup).post(userController.signup)
routes.route(routeNames.confirmEmail).get(userController.confirmEmail)
routes.route(routeNames.resendLink).post(authJwt.verifyToken, userController.resendLink)
routes.route(routeNames.get).get(authJwt.verifyToken, userController.getUser)
routes.route(routeNames.getUserById).get(authJwt.verifyToken, userController.getUserById)
routes.route(routeNames.update).post(authJwt.verifyToken, userController.update)
routes.route(routeNames.updateLanguage).post(authJwt.verifyToken, userController.updateLanguage)
routes.route(routeNames.updateEmailNotifications).post(authJwt.verifyToken, userController.updateEmailNotifications)
routes.route(routeNames.updatePrivateMessages).post(authJwt.verifyToken, userController.updatePrivateMessages)
routes.route(routeNames.resetPassword).post(authJwt.verifyToken, userController.resetPassword)
routes.route(routeNames.delete).post(authJwt.verifyToken, userController.deleteUser)
routes.route(routeNames.validateEmail).post(userController.validateEmail)
routes.route(routeNames.search).get(authJwt.verifyToken, userController.search)
routes.route(routeNames.updateAvatar).post([authJwt.verifyToken, multer({ storage: multer.memoryStorage() }).single('image')], userController.updateAvatar)
routes.route(routeNames.deleteAvatar).post(authJwt.verifyToken, userController.deleteAvatar)
routes.route(routeNames.checkBlockedUser).get(authJwt.verifyToken, userController.checkBlockedUser)
routes.route(routeNames.block).post(authJwt.verifyToken, userController.block)
routes.route(routeNames.unblock).post(authJwt.verifyToken, userController.unblock)
routes.route(routeNames.report).post(authJwt.verifyToken, userController.report)
routes.route(routeNames.comparePassword).get(authJwt.verifyToken, userController.comparePassword)

export default routes