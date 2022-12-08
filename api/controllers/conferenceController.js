import express from 'express';
import Conference from '../schema/Conference.js';
import User from '../schema/User.js';
import Connection from '../schema/Connection.js';
import Notification from '../schema/Notification.js';
import NotificationCounter from '../schema/NotificationCounter.js';
import routeNames from '../config/conferenceRoutes.config.js';
import authJwt from '../middlewares/authJwt.js';
import strings from '../config/app.config.js';
import { escapeRegex } from '../common/helper.js';

const HTTPS = process.env.WS_HTTPS.toLowerCase() === 'true';
const APP_HOST = process.env.WS_APP_HOST;

export const create = (req, res) => {
    const conference = new Conference(req.body);
    conference.save()
        .then(conf => {
            res.status(200).json(conf);
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
};

export const update = (req, res) => {
    Conference.findById(req.params.conferenceId)
        .then(conf => {
            if (conf) {
                if (req.body.isLive !== undefined) {
                    conf.isLive = req.body.isLive;
                }
                if (req.body.broadcastedAt !== undefined) {
                    conf.broadcastedAt = req.body.broadcastedAt;
                }
                if (req.body.finishedAt !== undefined) {
                    conf.finishedAt = req.body.finishedAt;
                }
                conf.save()
                    .then(() => res.sendStatus(200))
                    .catch(err => {
                        console.error(strings.DB_ERROR, err);
                        res.status(400).send(strings.DB_ERROR + err);
                    });
            } else {
                console.err('[conference.update] Conference not found:', req.params);
                res.sendStatus(204);
            }
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
};

export const addMember =  (req, res) => {
    Conference.findById(req.params.conferenceId)
        .then(conf => {
            if (conf) {
                if (!conf.members.includes(req.params.userId)) {
                    conf.members.push(req.params.userId);
                }
                conf.save()
                    .then(() => res.sendStatus(200))
                    .catch(err => {
                        console.error(strings.DB_ERROR, err);
                        res.status(400).send(strings.DB_ERROR + err);
                    });
            } else {
                console.err('[conference.addMember] Conference not found:', req.params);
                res.sendStatus(204);
            }
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
};

export const removeMember = (req, res) => {
    Conference.findById(req.params.conferenceId)
        .then(conf => {
            if (conf) {
                const index = conf.members.indexOf(req.params.userId);
                if (index !== -1) {
                    conf.members.splice(index, 1);
                }
                conf.save()
                    .then(() => res.sendStatus(200))
                    .catch(err => {
                        console.error(strings.DB_ERROR, err);
                        res.status(400).send(strings.DB_ERROR + err);
                    });
            } else {
                console.err('[conference.removeMember] Conference not found:', req.params);
                res.sendStatus(204);
            }
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
};

export const deleteConference = (req, res) => {
    Conference.findOneAndDelete({ _id: req.params.conferenceId })
        .then(() => {
            res.sendStatus(200);
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
};

export const getConference =  (req, res) => {
    Conference.findById(req.params.conferenceId)
        .populate('speaker')
        .then(conf => {
            if (conf) {
                res.json(conf);
            } else {
                console.err('[conference.getConference] Conference not found:', req.params);
                res.sendStatus(204);
            }
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
};

export const getConferences =  (req, res) => {
    const page = parseInt(req.params.page);
    const pageSize = parseInt(req.params.pageSize);
    let query = { speaker: req.params.userId };

    if (req.params.isPrivate === 'false') {
        query.isPrivate = false;
    }

    Conference.find(query, null, { skip: ((page - 1) * pageSize), limit: pageSize })
        .sort({ createdAt: -1 })
        .then(confs => {
            res.json(confs);
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
};

export const getMembers =  async (req, res) => {
    Conference.findById(req.params.conferenceId)
        .populate({
            path: 'members',
            match: { isBlacklisted: { $eq: false } }
        })
        .sort({ 'members.fullName': 1 })
        .then(conf => {
            console.log(conf.members);
            res.json(conf.members);
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });

};

export const close = (req, res) => {
    Connection.find({ connection: req.params.userId, isPending: false })
        .populate('user')
        .then(connections => {
            User.findById(req.params.userId).then(
                speaker => {
                    if (speaker) {
                        Conference.findById(req.params.conferenceId)
                            .then(conference => {
                                if (conference) {
                                    connections.forEach(connection => {
                                        strings.setLanguage(connection.user.language);

                                        const conferenceUrl = `${'http' + (HTTPS ? 's' : '') + ':\/\/' + APP_HOST}/conference?c=${conference._id}`;
                                        const linkRegex = escapeRegex(conference._id.toString());
                                        const messageRegex = escapeRegex(strings.CONFERENCE_NOTIFICATION_CLOSED);

                                        Notification.findOne({ $and: [{ user: connection.user._id }, { $and: [{ message: { $regex: messageRegex, $options: 'i' } }, { link: { $regex: linkRegex, $options: 'i' } }] }] })
                                            .then(notification => {
                                                if (!notification) {
                                                    const data = {
                                                        user: connection.user._id,
                                                        isRequest: false,
                                                        message: `${speaker.fullName} ${strings.CONFERENCE_NOTIFICATION_CLOSED} "${conference.title}".`,
                                                        isLink: true,
                                                        link: conferenceUrl
                                                    };
                                                    const notification = new Notification(data);
                                                    notification.save().then(() => {
                                                        NotificationCounter.findOne({ user: notification.user })
                                                            .then(counter => {
                                                                if (counter) {
                                                                    counter.count = counter.count + 1;
                                                                    counter.save()
                                                                        .catch(err => {
                                                                            console.error(strings.DB_ERROR, err);
                                                                        });
                                                                } else {
                                                                    const cnt = new NotificationCounter({ user: notification.user, count: 1 });
                                                                    cnt.save()
                                                                        .catch(err => {
                                                                            console.error(strings.DB_ERROR, err);
                                                                        });
                                                                }
                                                            })
                                                            .catch(err => {
                                                                console.error(strings.DB_ERROR, err);
                                                            });
                                                    });
                                                }
                                            });
                                    });
                                } else {
                                    console.err('[conference.close] Conference not found:', req.params);
                                    res.sendStatus(204);
                                }
                            });
                    } else {
                        console.err('[conference.close] Speaker not found:', req.params);
                        res.sendStatus(204);
                    }
                });

            res.sendStatus(200);
        }).catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
};