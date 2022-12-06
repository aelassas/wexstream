import express from 'express';
import routeNames from '../config/reportedUserRoutes.config.js';
import authJwt from '../middlewares/authJwt.js';
import ReportedUser from '../schema/ReportedUser.js';
import Report from '../schema/Report.js';
import User from '../schema/User.js';
import strings from '../config/app.config.js';
import nodemailer from 'nodemailer';

const DEFAULT_LANGUAGE = process.env.WS_DEFAULT_LANGUAGE;
const HTTPS = process.env.WS_HTTPS.toLowerCase() === 'true';
const APP_HOST = process.env.WS_APP_HOST;
const SMTP_HOST = process.env.WS_SMTP_HOST;
const SMTP_PORT = process.env.WS_SMTP_PORT;
const SMTP_USER = process.env.WS_SMTP_USER;
const SMTP_PASS = process.env.WS_SMTP_PASS;
const SMTP_FROM = process.env.WS_SMTP_FROM;
const ADMIN_EMAIL = process.env.WS_ADMIN_EMAIL;

const routes = express.Router();

routes.route(routeNames.report).post(authJwt.verifyToken, (req, res) => {
    ReportedUser.findOne({ user: req.body.user, reportedUser: req.body.reportedUser })
        .then(ru => {
            if (ru) {
                const report = new Report({ message: req.body.message });
                report.save()
                    .then(() => {
                        ru.reports.push(report._id);
                        ru.save()
                            //.then(() => res.sendStatus(200))
                            .catch(err => {
                                console.error(strings.DB_ERROR, err);
                                res.status(400).send(strings.DB_ERROR + err);
                            });
                    })
                    .catch(err => {
                        console.error(strings.DB_ERROR, err);
                        res.status(400).send(strings.DB_ERROR + err);
                    });
            } else {
                const report = new Report({ message: req.body.message });
                report.save()
                    .then(() => {
                        const reportedUser = new ReportedUser({
                            user: req.body.user,
                            reportedUser: req.body.reportedUser,
                            reports: [report._id]
                        });
                        reportedUser.save()
                            //.then(() => res.sendStatus(200))
                            .catch(err => {
                                console.error(strings.DB_ERROR, err);
                                res.status(400).send(strings.DB_ERROR + err);
                            });
                    })
                    .catch(err => {
                        console.error(strings.DB_ERROR, err);
                        res.status(400).send(strings.DB_ERROR + err);
                    });
            }

            User.findById(req.body.user)
                .then(user => {
                    User.findById(req.body.reportedUser)
                        .then(async reportedUser => {
                            strings.setLanguage(DEFAULT_LANGUAGE);

                            const transporter = nodemailer.createTransport({
                                host: SMTP_HOST,
                                port: SMTP_PORT,
                                auth: {
                                    user: SMTP_USER,
                                    pass: SMTP_PASS
                                }
                            });
                            console.log(ADMIN_EMAIL);
                            const mailOptions = {
                                from: SMTP_FROM,
                                to: ADMIN_EMAIL,
                                subject: user.fullName + ' ' + strings.REPORTED + ' ' + reportedUser.fullName,
                                html: '<p>'
                                    + strings.HELLO + ',<br><br>'
                                    + strings.REPORTED_MESSAGE + req.body.message + '<br>'
                                    + strings.REPORTED_BY + 'http' + (HTTPS ? 's' : '') + ':\/\/' + APP_HOST + '\/profile?u=' + user._id + '<br>'
                                    + strings.REPORTED_USER + 'http' + (HTTPS ? 's' : '') + ':\/\/' + APP_HOST + '\/profile?u=' + reportedUser._id + '<br>'
                                    + '<br>' + strings.REGARDS + '<br>'
                                    + '</p>'
                            };

                            await transporter.sendMail(mailOptions, (err, info) => {
                                if (err) {
                                    console.error(strings.SMTP_ERROR, err);
                                    res.status(400).send(strings.SMTP_ERROR + err);
                                } else {
                                    res.sendStatus(200);
                                }
                            });
                        })
                        .catch(err => {
                            console.error(strings.DB_ERROR, err);
                            res.status(400).send(strings.DB_ERROR + err);
                        });
                })
                .catch(err => {
                    console.error(strings.DB_ERROR, err);
                    res.status(400).send(strings.DB_ERROR + err);
                });
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err);
            res.status(400).send(strings.DB_ERROR + err);
        });
});

export default routes;