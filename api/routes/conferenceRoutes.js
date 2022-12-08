import express from 'express';
import routeNames from '../config/conferenceRoutes.config.js';
import authJwt from '../middlewares/authJwt.js';
import * as conferenceController from '../controllers/conferenceController.js';


const routes = express.Router();

routes.route(routeNames.create).post(authJwt.verifyToken, conferenceController.create);
routes.route(routeNames.update).post(authJwt.verifyToken, conferenceController.update);
routes.route(routeNames.addMember).post(authJwt.verifyToken, conferenceController.addMember);
routes.route(routeNames.removeMember).post(authJwt.verifyToken, conferenceController.removeMember);
routes.route(routeNames.delete).delete(authJwt.verifyToken, conferenceController.deleteConference);
routes.route(routeNames.getConference).get(authJwt.verifyToken, conferenceController.getConference);
routes.route(routeNames.getConferences).get(authJwt.verifyToken, conferenceController.getConferences);
routes.route(routeNames.getMembers).get(authJwt.verifyToken, conferenceController.getMembers);
routes.route(routeNames.close).post(authJwt.verifyToken, conferenceController.close);

export default routes;