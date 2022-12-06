import express from 'express';
import User from '../schema/User.js';
import Connection from '../schema/Connection.js';
import Notification from '../schema/Notification.js';
import Token from '../schema/Token.js';
import NotificationCounter from '../schema/NotificationCounter.js';
import routeNames from '../config/userRoutes.config.js';
import jwt from 'jsonwebtoken';
import authJwt from '../middlewares/authJwt.js';
import validator from 'validator';
import strings from '../config/app.config.js';
import escapeStringRegexp from 'escape-string-regexp';
import multer from 'multer';
import Timeline from '../schema/Timeline.js';
import Conference from '../schema/Conference.js';
import Message from '../schema/Message.js';
import MessageCounter from '../schema/MessageCounter.js';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const HTTPS = process.env.WS_HTTPS.toLowerCase() === 'true';
const JWT_SECRET = process.env.WS_JWT_SECRET;
const JWT_EXPIRE_AT = parseInt(process.env.WS_JWT_EXPIRE_AT);
const SMTP_HOST = process.env.WS_SMTP_HOST;
const SMTP_PORT = process.env.WS_SMTP_PORT;
const SMTP_USER = process.env.WS_SMTP_USER;
const SMTP_PASS = process.env.WS_SMTP_PASS;
const SMTP_FROM = process.env.WS_SMTP_FROM;
const CDN = process.env.WS_CDN;

const routes = express.Router();

// Google Auth Router
routes.route(routeNames.googleAuth).post((req, res) => {
    User.findOne({ email: req.body.email })
        .then(async user => {
            const { body } = req;

            if (!user) {
                body.isVerified = true;
                body.isBlacklisted = false;

                let newUser = new User(body);
                try {
                    newUser = await newUser.save();
                } catch (err) {
                    console.error(strings.DB_ERROR, err);
                    res.status(400).send(strings.DB_ERROR, err);
                }
                user = newUser;
            }

            let update = false;
            if (!user.googleId || (user.googleId && user.googleId !== body.googleId)) {
                user.googleId = body.googleId;
                update = true;
            }

            if (!user.avatar || (user.avatar && user.avatar.startsWith('http'))) {
                user.avatar = body.avatar;
                update = true;
            }

            if (update) {
                try {
                    await user.save();
                } catch (err) {
                    console.error(strings.DB_ERROR, err);
                    res.status(400).send(strings.DB_ERROR, err);
                }
            }

            const payload = {
                context: {
                    user: {
                        name: user.fullName,
                        id: user.id
                    },
                    group: "wexstream"
                },
                aud: "wexstream",
                iss: "wexstream",
                sub: "www.wexstream.com",
                room: "*",
                exp: (Math.floor(Date.now() / 1000) + JWT_EXPIRE_AT)
            };

            const token = jwt.sign(payload, JWT_SECRET);

            res.status(200).send({
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                language: user.language,
                enableEmailNotifications: user.enableEmailNotifications,
                enablePrivateMessages: user.enablePrivateMessages,
                accessToken: token,
                isBlacklisted: user.isBlacklisted
            });
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR, err);
        })
});

// Facebook Auth Router
routes.route(routeNames.facebookAuth).post((req, res) => {
    User.findOne({ email: req.body.email })
        .then(async user => {
            const { body } = req;

            if (!user) {
                body.isVerified = true;
                body.isBlacklisted = false;

                let newUser = new User(body);
                try {
                    newUser = await newUser.save();
                } catch (err) {
                    console.error(strings.DB_ERROR, err);
                    res.status(400).send(strings.DB_ERROR, err);
                }
                user = newUser;
            }

            let update = false;
            if (!user.facebookId || (user.facebookId && user.facebookId !== body.facebookId)) {
                user.facebookId = body.facebookId;
                update = true;
            }

            if (!user.avatar || (user.avatar && user.avatar.startsWith('http'))) {
                user.avatar = body.avatar;
                update = true;
            }

            if (update) {
                try {
                    await user.save();
                } catch (err) {
                    console.error(strings.DB_ERROR, err);
                    res.status(400).send(strings.DB_ERROR, err);
                }
            }

            const payload = {
                context: {
                    user: {
                        name: user.fullName,
                        id: user.id
                    },
                    group: "wexstream"
                },
                aud: "wexstream",
                iss: "wexstream",
                sub: "www.wexstream.com",
                room: "*",
                exp: (Math.floor(Date.now() / 1000) + JWT_EXPIRE_AT)
            };

            const token = jwt.sign(payload, JWT_SECRET);

            res.status(200).send({
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                language: user.language,
                enableEmailNotifications: user.enableEmailNotifications,
                enablePrivateMessages: user.enablePrivateMessages,
                accessToken: token,
                isBlacklisted: user.isBlacklisted
            });
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR, err);
        })
});

// Sign in Router
routes.route(routeNames.signin).post((req, res) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user || (user && !user.password)) {
                res.sendStatus(204);
            } else {
                bcrypt.compare(req.body.password, user.password).then(passwordMatch => {
                    if (passwordMatch) {
                        const payload = {
                            context: {
                                user: {
                                    name: user.fullName,
                                    id: user.id
                                },
                                group: "wexstream"
                            },
                            aud: "wexstream",
                            iss: "wexstream",
                            sub: "www.wexstream.com",
                            room: "*",
                            exp: (Math.floor(Date.now() / 1000) + JWT_EXPIRE_AT)
                        };

                        const token = jwt.sign(payload, JWT_SECRET);

                        res.status(200).send({
                            id: user._id,
                            email: user.email,
                            fullName: user.fullName,
                            language: user.language,
                            enableEmailNotifications: user.enableEmailNotifications,
                            enablePrivateMessages: user.enablePrivateMessages,
                            accessToken: token,
                            isBlacklisted: user.isBlacklisted
                        });
                    } else {
                        res.sendStatus(204);
                    }
                })
            }
        });
});


// Validate JWT token Router
routes.route(routeNames.validateAccessToken).post(authJwt.verifyToken, (req, res) => {
    res.sendStatus(200);
});

// Sign up route
routes.route(routeNames.signup).post((req, res) => {
    const { body } = req;
    body.isVerified = false;
    body.isBlacklisted = false;

    const user = new User(body);
    user.save()
        .then(user => {
            // generate token and save
            const token = new Token({ user: user._id, token: crypto.randomBytes(16).toString('hex') });

            token.save()
                .then(token => {
                    // Send email
                    strings.setLanguage(user.language);

                    const transporter = nodemailer.createTransport({
                        host: SMTP_HOST,
                        port: SMTP_PORT,
                        auth: {
                            user: SMTP_USER,
                            pass: SMTP_PASS
                        }
                    });
                    const mailOptions = {
                        from: SMTP_FROM,
                        to: user.email,
                        subject: strings.ACCOUNT_VALIDATION_SUBJECT,
                        html: '<p ' + (user.language === 'ar' ? 'dir="rtl"' : ')') + '>' + strings.HELLO + user.fullName + ',<br> <br>'
                            + strings.ACCOUNT_VALIDATION_LINK + '<br><br>http' + (HTTPS ? 's' : '') + ':\/\/' + req.headers.host + '\/api/confirm-email\/' + user.email + '\/' + token.token + '<br><br>' + strings.REGARDS + '<br>'
                            + '</p>'
                    };
                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            console.error(strings.SMTP_ERROR, err);

                            User.deleteOne({ _id: user._id }, (error, response) => {
                                if (error) {
                                    console.error(strings.DB_ERROR, error);
                                    res.status(400).send(getStatusMessage(user.language, strings.DB_ERROR + error));
                                } else {
                                    res.status(500).send(getStatusMessage(user.language, strings.ACCOUNT_VALIDATION_TECHNICAL_ISSUE + ' ' + err.response));
                                }
                            });
                        } else {
                            res.status(200).send(getStatusMessage(user.language, strings.ACCOUNT_VALIDATION_EMAIL_SENT_PART_1 + user.email + strings.ACCOUNT_VALIDATION_EMAIL_SENT_PART_2));
                        }
                    });
                })
                .catch(err => {
                    console.error(strings.DB_ERROR, err);
                    res.status(400).send(getStatusMessage(user.language, strings.DB_ERROR + err));
                });

        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
});

// /api/confirm-email/:email/:token
routes.route(routeNames.confirmEmail).get((req, res) => {
    Token.findOne({ token: req.params.token }, (err, token) => {
        User.findOne({ email: req.params.email }, (err, user) => {
            strings.setLanguage(user.language);
            // token is not found into database i.e. token may have expired 
            if (!token) {
                console.error(strings.ACCOUNT_VALIDATION_LINK_EXPIRED, req.params);
                return res.status(400).send(getStatusMessage(user.language, strings.ACCOUNT_VALIDATION_LINK_EXPIRED));
            }
            // if token is found then check valid user 
            else {
                // not valid user
                if (!user) {
                    console.error('[user.confirmEmail] User not found', req.params);
                    return res.status(401).send(getStatusMessage(user.language, strings.ACCOUNT_VALIDATION_LINK_ERROR));
                }
                // user is already verified
                else if (user.isVerified) {
                    return res.status(200).send(getStatusMessage(user.language, strings.ACCOUNT_VALIDATION_ACCOUNT_VERIFIED));
                }
                // verify user
                else {
                    // change isVerified to true
                    user.isVerified = true;
                    user.verifiedAt = Date.now();
                    user.save((err) => {
                        // error occur
                        if (err) {
                            console.error('[user.confirmEmail] ' + strings.DB_ERROR + ' ' + req.params, err);
                            return res.status(500).send(getStatusMessage(user.language, err.message));
                        }
                        // account successfully verified
                        else {
                            return res.status(200).send(getStatusMessage(user.language, strings.ACCOUNT_VALIDATION_SUCCESS));
                        }
                    });

                }
            }
        });
    });
});

// Resend verification link
routes.route(routeNames.resendLink).post(authJwt.verifyToken, (req, res, next) => {
    User.findOne({ email: req.body.email }, (err, user) => {

        // user is not found into database
        if (!user) {
            console.error('[user.resendLink] User not found:', req.params);
            return res.status(400).send(getStatusMessage(user.language, strings.ACCOUNT_VALIDATION_RESEND_ERROR));
        }
        // user has been already verified
        else if (user.isVerified) {
            return res.status(200).send(getStatusMessage(user.language, strings.ACCOUNT_VALIDATION_ACCOUNT_VERIFIED));

        }
        // send verification link
        else {
            // generate token and save
            const token = new Token({ user: user._id, token: crypto.randomBytes(16).toString('hex') });
            token.save((err) => {
                if (err) {
                    console.error('[user.resendLink] ' + strings.DB_ERROR, req.params);
                    return res.status(500).send(getStatusMessage(user.language, err.message));
                }

                // Send email
                const transporter = nodemailer.createTransport({
                    host: SMTP_HOST,
                    port: SMTP_PORT,
                    auth: {
                        user: SMTP_USER,
                        pass: SMTP_PASS
                    }
                });

                strings.setLanguage(user.language);
                const mailOptions = { from: SMTP_FROM, to: user.email, subject: strings.ACCOUNT_VALIDATION_SUBJECT, html: '<p ' + (user.language === 'ar' ? 'dir="rtl"' : ')') + '>' + strings.HELLO + user.fullName + ',<br> <br>' + strings.ACCOUNT_VALIDATION_LINK + '<br><br>http' + (HTTPS ? 's' : '') + ':\/\/' + req.headers.host + '\/api/confirm-email\/' + user.email + '\/' + token.token + '<br><br>' + strings.REGARDS + '<br>' + '</p>' };
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.error('[user.resendLink] ' + strings.SMTP_ERROR, req.params);
                        return res.status(500).send(getStatusMessage(user.language, strings.ACCOUNT_VALIDATION_TECHNICAL_ISSUE + ' ' + err.response));
                    }
                    return res.status(200).send(getStatusMessage(user.language, strings.ACCOUNT_VALIDATION_EMAIL_SENT_PART_1 + user.email + strings.ACCOUNT_VALIDATION_EMAIL_SENT_PART_2));
                });
            });
        }
    });
});

// Get User Router
routes.route(routeNames.get)
    .get(authJwt.verifyToken, (req, res) => {
        User.findById(req.params.id)
            .then(user => {
                if (!user) {
                    console.error('[user.get] User not found:', req.params);
                    res.sendStatus(204);
                } else {
                    res.json(user);
                }
            })
            .catch(err => {
                console.error(strings.DB_ERROR, err);
                res.status(400).send(strings.DB_ERROR + err);
            });
    });

// Get User by Id Router
routes.route(routeNames.getUserById)
    .get(authJwt.verifyToken, (req, res) => {
        User.findById(req.params.userId)
            .then(user => {
                if (!user) {
                    console.error('[user.getUserById] User not found:', req.params);
                    res.sendStatus(204);
                } else {
                    res.json(user);
                }
            })
            .catch(err => {
                console.error(strings.DB_ERROR, err);
                res.status(400).send(strings.DB_ERROR + err);
            });
    });

// Update User Router
routes.route(routeNames.update)
    .post(authJwt.verifyToken, (req, res) => {
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    console.error('[user.update] User not found:', req.body.email);
                    res.sendStatus(204);
                } else {
                    const { fullName, bio, location, website } = req.body;
                    user.fullName = fullName;
                    user.bio = bio || '';
                    user.location = location || '';
                    user.website = website || '';

                    user.save()
                        .then(user => {
                            res.sendStatus(200);
                        })
                        .catch(err => {
                            console.error(strings.DB_ERROR, err);
                            res.status(400).send(strings.DB_ERROR + err);
                        });

                }
            });
    });

// Update Language Router
routes.route(routeNames.updateLanguage)
    .post(authJwt.verifyToken, (req, res) => {
        User.findById(req.body.id)
            .then(user => {
                if (!user) {
                    console.error('[user.updateLanguage] User not found:', req.body.id);
                    res.sendStatus(204);
                } else {
                    user.language = req.body.language;
                    user.save()
                        .then(() => {
                            res.sendStatus(200);
                        })
                        .catch(err => {
                            console.error(strings.DB_ERROR, err);
                            res.status(400).send(strings.DB_ERROR + err);
                        });

                }
            });
    });


// Update Email Notifications Router
routes.route(routeNames.updateEmailNotifications)
    .post(authJwt.verifyToken, (req, res) => {
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    console.error('[user.updateEmailNotifications] User not found:', req.body.email);
                    res.sendStatus(204);
                } else {
                    user.enableEmailNotifications = req.body.enableEmailNotifications;
                    user.save()
                        .then(user => {
                            res.sendStatus(200);
                        })
                        .catch(err => {
                            console.error(strings.DB_ERROR, err);
                            res.status(400).send(strings.DB_ERROR + err);
                        });

                }
            });
    });

// Update Private Messages Router
routes.route(routeNames.updatePrivateMessages)
    .post(authJwt.verifyToken, (req, res) => {
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    console.error('[user.updatePrivateMessages] User not found:', req.body.email);
                    res.sendStatus(204);
                } else {
                    user.enablePrivateMessages = req.body.enablePrivateMessages;
                    user.save()
                        .then(user => {
                            res.sendStatus(200);
                        })
                        .catch(err => {
                            console.error(strings.DB_ERROR, err);
                            res.status(400).send(strings.DB_ERROR + err);
                        });

                }
            });
    });

// Reset password Router
routes.route(routeNames.resetPassword)
    .post(authJwt.verifyToken, (req, res) => {
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    console.error('[user.resetPassword] User not found:', req.body.email);
                    res.sendStatus(204);
                } else {
                    if (req.body.password === user.password) {
                        user.password = req.body.newPassword;
                        user.save()
                            .then(user => {
                                res.sendStatus(200);
                            })
                            .catch(err => {
                                console.error(strings.DB_ERROR, err);
                                res.status(400).send(strings.DB_ERROR + err);
                            });
                    } else {
                        res.sendStatus(204);
                    }
                }
            });
    });

// Delete User Router
routes.route(routeNames.delete)
    .post(authJwt.verifyToken, (req, res) => {
        User.findById(req.params.id)
            .then(user => {
                if (!user) {
                    console.error('[user.delete] User not found:', req.body.email);
                    res.sendStatus(204);
                } else {
                    // Delete notifications
                    Connection.find({ connection: user._id }).then(connections => {
                        if (connections) {
                            connections.forEach(conn => {
                                Notification.findOne({ approverConnection: conn._id }).then(notif => {
                                    if (notif) {
                                        Notification.deleteOne({ _id: notif._id }, err => {
                                            if (err) {
                                                console.error('[user.delete] ' + strings.DB_DELETE_ERROR + ' ' + req.body.email, err);
                                                res.status(400).send(strings.DB_DELETE_ERROR + err);
                                            } else {
                                                NotificationCounter.findOne({ user: notif.user }).then(nc => {
                                                    if (nc && nc.count > 0) {
                                                        nc.count = nc.count - 1;
                                                        nc.save()
                                                            .catch(err => {
                                                                console.error(strings.DB_ERROR, err);
                                                                res.status(400).send(strings.DB_ERROR + err);
                                                            });
                                                    }
                                                });

                                                Connection.deleteOne({ _id: conn._id },
                                                    (err, response) => {
                                                        if (err) {
                                                            console.error('[user.delete] ' + strings.DB_DELETE_ERROR + ' ' + req.body.email, err);
                                                            res.status(400).send(strings.DB_DELETE_ERROR + err);
                                                        }
                                                    });
                                            }
                                        })
                                    }
                                });

                                Connection.deleteMany({ connection: user._id },
                                    (err, response) => {
                                        if (err) {
                                            console.error('[user.delete] ' + strings.DB_DELETE_ERROR + ' ' + req.body.email, err);
                                            res.status(400).send(strings.DB_DELETE_ERROR + err);
                                        }
                                    });
                            });
                        }
                    });

                    // Delete timeline entries
                    Timeline.deleteMany({ $or: [{ speaker: user._id }, { subscriber: user._id }] })
                        .catch(err => {
                            console.error('[user.delete] ' + strings.DB_DELETE_ERROR + ' ' + req.body.email, err);
                            res.status(400).send(strings.DB_ERROR + err);
                        });

                    // Delete conferences
                    Conference.deleteMany({ speaker: user._id })
                        .catch(err => {
                            console.error('[user.delete] ' + strings.DB_DELETE_ERROR + ' ' + req.body.email, err);
                            res.status(400).send(strings.DB_ERROR + err);
                        });

                    // Delete messages and messageCounter
                    Message.deleteMany({ to: user._id })
                        .then(() => {
                            MessageCounter.deleteOne({ user: user._id })
                                .catch(err => {
                                    console.error('[user.delete] ' + strings.DB_DELETE_ERROR + ' ' + req.body.email, err);
                                    res.status(400).send(strings.DB_ERROR + err);
                                });
                        })
                        .catch(err => res.status(400).send(strings.DB_ERROR + err));

                    // Delete user, connections, notifications and notificationCounter
                    User.deleteOne({ _id: user._id }, err => {
                        if (err) {
                            console.error('[user.delete] ' + strings.DB_DELETE_ERROR + ' ' + req.body.email, err);
                            res.status(400).send(strings.DB_DELETE_ERROR + err);
                        } else {
                            Connection.deleteMany({ user: user._id }, // { $or: [{ user: user._id }, { connection: user._id }] }
                                (err, approverRes) => {
                                    if (err) {
                                        console.error('[user.delete] ' + strings.DB_DELETE_ERROR + ' ' + req.body.email, err);
                                        res.status(400).send(strings.DB_DELETE_ERROR + err);
                                    }
                                });
                            Notification.deleteMany({ user: user._id },
                                (err) => {
                                    if (err) {
                                        console.error('[user.delete] ' + strings.DB_DELETE_ERROR + ' ' + req.body.email, err);
                                        res.status(400).send(strings.DB_DELETE_ERROR + err);
                                    }
                                });
                            NotificationCounter.deleteOne({ user: user._id },
                                (err) => {
                                    if (err) {
                                        console.error('[user.delete] ' + strings.DB_DELETE_ERROR + ' ' + req.body.email, err);
                                        res.status(400).send(strings.DB_DELETE_ERROR + err);
                                    }
                                });

                            if (user.avatar && !user.avatar.startsWith('http')) {
                                const avatar = path.join(CDN, user.avatar);
                                if (fs.existsSync(avatar)) {
                                    fs.unlinkSync(avatar);
                                }
                            }
                            res.sendStatus(200);
                        }
                    });
                }
            });
    });

// Email validation Router
routes.route(routeNames.validateEmail)
    .post((req, res) => {
        User.findOne({ email: req.body.email })
            .then(user => user || !validator.isEmail(req.body.email) ? res.sendStatus(204) : res.sendStatus(200))
            .catch(err => {
                console.error('[user.validateEmail] ' + strings.DB_ERROR + ' ' + req.body.email, err);
                res.status(400).send(strings.DB_ERROR + err);
            })
    });

// Search users route
routes.route(routeNames.search).get(authJwt.verifyToken, async (req, res) => {

    try {
        const userId = mongoose.Types.ObjectId(req.params.userId);
        const searchKeyword = escapeStringRegexp(req.query.s || '');
        const options = 'i';
        const page = parseInt(req.params.page);
        const pageSize = parseInt(req.params.pageSize);
        const messages = req.params.messages.toLowerCase() === 'true';

        let $match = { isBlacklisted: false };
        if (messages) {
            $match = { $and: [{ isBlacklisted: false }, { $or: [{ enablePrivateMessages: true }, { connection: { $ne: undefined } }] }] };
        }

        const user = await User.findById(req.params.userId);

        const users = await User.aggregate([
            {
                $lookup: {
                    from: 'BlockedUser',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ['$user', '$$userId'] }, { $eq: ['$blockedUser', userId] }]
                                }
                            }
                        }
                    ],
                    as: 'blockedUser'
                }
            },
            { $unwind: { path: '$blockedUser', preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    $and: [
                        {
                            fullName: { $regex: searchKeyword, $options: options }
                        },
                        { _id: { $ne: mongoose.Types.ObjectId(req.params.userId) } },
                        { blockedUser: { $eq: undefined } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'Connection',
                    let: { connectionId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ['$connection', '$$connectionId'] }, { $eq: ['$user', userId] }]
                                }
                            }
                        }
                    ],
                    as: 'connection'
                }
            },
            { $unwind: { path: '$connection', preserveNullAndEmptyArrays: true } },
            {
                $match
            },
            { $sort: { fullName: 1 } },
            { $skip: ((page - 1) * pageSize) },
            { $limit: pageSize }
        ], { collation: { locale: user.language, strength: 2 } });

        res.json(users);
    } catch (err) {
        console.error(strings.DB_ERROR, err);
        res.status(400).send(strings.DB_ERROR + err);
    }
});

routes.route(routeNames.updateAvatar)
    .post([authJwt.verifyToken, multer({ storage: multer.memoryStorage() }).single('image')], (req, res) => {
        const userId = req.params.userId;

        User.findById(userId)
            .then(user => {
                if (user) {

                    if (user.avatar && !user.avatar.startsWith('http')) {
                        const avatar = path.join(CDN, user.avatar);
                        if (fs.existsSync(avatar)) {
                            fs.unlinkSync(avatar);
                        }
                    }

                    const filename = `${user._id}_${Date.now()}${path.extname(req.file.originalname)}`;
                    const filepath = path.join(CDN, filename);

                    fs.writeFileSync(filepath, req.file.buffer);
                    user.avatar = filename;
                    user.save()
                        .then(usr => {
                            res.sendStatus(200);
                        })
                        .catch(err => {
                            console.error(strings.DB_ERROR, err);
                            res.status(400).send(strings.DB_ERROR + err);
                        });
                } else {
                    console.error('[user.updateAvatar] User not found:', req.params.userId);
                    res.sendStatus(204);
                }
            })
            .catch(err => {
                console.error(strings.DB_ERROR, err);
                res.status(400).send(strings.DB_ERROR + err);
            });
    });

routes.route(routeNames.deleteAvatar)
    .post(authJwt.verifyToken, (req, res) => {
        const userId = req.params.userId;

        User.findById(userId)
            .then(user => {
                if (user) {
                    if (user.avatar && !user.avatar.startsWith('http')) {
                        const avatar = path.join(CDN, user.avatar);
                        if (fs.existsSync(avatar)) {
                            fs.unlinkSync(avatar);
                        }
                    }
                    user.avatar = null;

                    user.save()
                        .then(usr => {
                            res.sendStatus(200);
                        })
                        .catch(err => {
                            console.error(strings.DB_ERROR, err);
                            res.status(400).send(strings.DB_ERROR + err);
                        });
                } else {
                    console.error('[user.updateAvatar] User not found:', req.params.userId);
                    res.sendStatus(204);
                }
            })
            .catch(err => {
                console.error(strings.DB_ERROR, err);
                res.status(400).send(strings.DB_ERROR + err);
            });
    });

const getStatusMessage = (lang, msg) => {
    if (lang === 'ar') {
        return '<!DOCTYPE html><html dir="rtl" lang="ar"><head></head><body><p>' + msg + '</p></body></html>';
    }
    return '<!DOCTYPE html><html lang="' + lang + '"><head></head><body><p>' + msg + '</p></body></html>';
};

export default routes;