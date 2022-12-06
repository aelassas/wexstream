import express from 'express';
import routeNames from '../config/blockedUserRoutes.config.js';
import authJwt from '../middlewares/authJwt.js';
import BlockedUser from '../schema/BlockedUser.js';
import Notification from '../schema/Notification.js';
import NotificationCounter from '../schema/NotificationCounter.js';
import strings from '../config/app.config.js';
import mongoose from 'mongoose';

const routes = express.Router();

routes.route(routeNames.checkBlockedUser).get(authJwt.verifyToken, (req, res) => {
    BlockedUser.findOne({ user: req.params.userId, blockedUser: req.params.blockedUserId })
        .then(blockedUser => {
            if (blockedUser) {
                res.sendStatus(200);
            } else {
                console.error('[checkBlockedUser] User not found:', req.params);
                res.sendStatus(204);
            }
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
});

routes.route(routeNames.block).post(authJwt.verifyToken, (req, res) => {
    BlockedUser.findOne({ user: req.params.userId, blockedUser: req.params.blockedUserId })
        .then(bu => {
            if (bu) {
                console.error('[block] ' + strings.ALREADY_BLOCKED, req.params);
                res.status(400).send(strings.ALREADY_BLOCKED);
            } else {
                const blockedUser = new BlockedUser({
                    user: req.params.userId,
                    blockedUser: req.params.blockedUserId
                });
                blockedUser.save()
                    .then(async () => {
                        const notifications = await Notification.aggregate([
                            { $match: { user: mongoose.Types.ObjectId(req.params.blockedUserId), senderUser: mongoose.Types.ObjectId(req.params.userId), isRead: false } }
                        ]);

                        if (notifications.length > 0) {
                            const counter = await NotificationCounter.findOne({ user: req.params.blockedUserId });
                            if (counter) {
                                counter.count -= notifications.length;
                                await counter.save();
                            }
                        }

                        res.sendStatus(200);
                    })
                    .catch(err => {
                        console.error(strings.DB_ERROR, err);
                        res.status(400).send(strings.DB_ERROR + err);
                    });
            }
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
});

routes.route(routeNames.unblock).post(authJwt.verifyToken, (req, res) => {
    BlockedUser.deleteOne({ user: req.params.userId, blockedUser: req.params.blockedUserId })
        .then(async result => {
            if (result.deletedCount === 1) {
                const notifications = await Notification.aggregate([
                    { $match: { user: mongoose.Types.ObjectId(req.params.blockedUserId), senderUser: mongoose.Types.ObjectId(req.params.userId), isRead: false } }
                ]);

                if (notifications.length > 0) {
                    const counter = await NotificationCounter.findOne({ user: req.params.blockedUserId });
                    if (counter) {
                        counter.count += notifications.length;
                        await counter.save();
                    }
                }
                res.sendStatus(200);
            } else {
                console.error('[unblock] Error while unblocking user:', req.params);
                res.sendStatus(204);
            }
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
});

export default routes;