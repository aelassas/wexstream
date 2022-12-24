import strings from '../config/app.config.js'
import Notification from '../models/Notification.js'
import NotificationCounter from '../models/NotificationCounter.js'
import User from '../models/User.js'
import Connection from '../models/Connection.js'
import nodemailer from "nodemailer"
import mongoose from 'mongoose'

const HTTPS = process.env.WS_HTTPS.toLowerCase() === 'true'
const APP_HOST = process.env.WS_APP_HOST
const SMTP_HOST = process.env.WS_SMTP_HOST
const SMTP_PORT = process.env.WS_SMTP_PORT
const SMTP_USER = process.env.WS_SMTP_USER
const SMTP_PASS = process.env.WS_SMTP_PASS
const SMTP_FROM = process.env.WS_SMTP_FROM

export const notify = async (req, res) => {
    const notification = new Notification(req.body)
    notification.save()
        .then(notification => {
            User.findById(notification.user)
                .then(user => {
                    if (user) {
                        NotificationCounter.findOne({ user: notification.user })
                            .then(async counter => {
                                if (user.enableEmailNotifications) {
                                    strings.setLanguage(user.language)

                                    const transporter = nodemailer.createTransport({
                                        host: SMTP_HOST,
                                        port: SMTP_PORT,
                                        auth: {
                                            user: SMTP_USER,
                                            pass: SMTP_PASS
                                        }
                                    })

                                    const mailOptions = {
                                        from: SMTP_FROM,
                                        to: user.email,
                                        subject: strings.NOTIFICATION_SUBJECT,
                                        html: '<p ' + (user.language === 'ar' ? 'dir="rtl"' : ')') + '>'
                                            + strings.HELLO + user.fullName + ',<br><br>'
                                            + strings.NOTIFICATION_BODY + '<br><br>'
                                            + '---<br>'
                                            + notification.message + '<br><br>'
                                            + (notification.isLink ? ('<a href="' + notification.link + '">' + strings.NOTIFICATION_LINK + '</a>' + '<br>') : '')
                                            + '<a href="' + 'http' + (HTTPS ? 's' : '') + ':\/\/' + APP_HOST + '\/notifications' + '">' + strings.NOTIFICATIONS_LINK + '</a>'
                                            + '<br>---'
                                            + '<br><br>' + strings.REGARDS + '<br>'
                                            + '</p>'
                                    }
                                    await transporter.sendMail(mailOptions, (err, info) => {
                                        if (err) {
                                            console.error(strings.SMTP_ERROR, err)
                                            res.status(400).send(strings.SMTP_ERROR + err)
                                        }
                                    })
                                }

                                if (counter) {
                                    counter.count = counter.count + 1
                                    counter.save()
                                        .then(ct => {
                                            res.sendStatus(200)
                                        })
                                        .catch(err => {
                                            console.error(strings.DB_ERROR, err)
                                            res.status(400).send(strings.DB_ERROR + err)
                                        })
                                } else {
                                    const cnt = new NotificationCounter({ user: notification.user, count: 1 })
                                    cnt.save()
                                        .then(n => {
                                            res.sendStatus(200)
                                        })
                                        .catch(err => {
                                            console.error(strings.DB_ERROR, err)
                                            res.status(400).send(strings.DB_ERROR + err)
                                        })
                                }
                            })
                            .catch(err => {
                                console.error(strings.DB_ERROR, err)
                                res.status(400).send(strings.DB_ERROR + err)
                            })
                    } else {
                        console.error(strings.DB_ERROR, err)
                        res.status(400).send(strings.DB_ERROR + err)
                    }
                })
                .catch(err => {
                    console.error(strings.DB_ERROR, err)
                    res.status(400).send(strings.DB_ERROR + err)
                })
        })
        .catch(err => {
            res.status(400).send(strings.DB_ERROR + err)
        })
}

export const approve = (req, res) => {
    Notification.findById(req.params.notificationId)
        .then(notification => {
            if (notification) {
                Connection.findById(notification.senderConnection)
                    .then(cs => {
                        if (cs) {
                            const now = Date.now()
                            cs.isPending = false
                            cs.connectedAt = now
                            cs.save()
                                .then(n => {
                                    Connection.findById(notification.approverConnection)
                                        .then(ca => {
                                            if (ca) {
                                                ca.isPending = false
                                                ca.connectedAt = now
                                                ca.save()
                                                    .then(can => {
                                                        const isRead = notification.isRead
                                                        notification.isRead = true
                                                        notification.isConnected = true
                                                        notification.isDeclined = false
                                                        notification.save()
                                                            .then(nn => {
                                                                if (!isRead) {
                                                                    NotificationCounter.findOne({ user: notification.user })
                                                                        .then(counter => {
                                                                            if (counter) {
                                                                                counter.count = counter.count - 1
                                                                                counter.save()
                                                                                    .then(ct => {
                                                                                        res.sendStatus(200)
                                                                                    })
                                                                                    .catch(err => {
                                                                                        console.error(strings.DB_ERROR, err)
                                                                                        res.status(400).send(strings.DB_ERROR + err)
                                                                                    })
                                                                            } else {
                                                                                console.error('[notification.approve] Counter not found:', notification.user)
                                                                                res.sendStatus(204)
                                                                            }
                                                                        })
                                                                        .catch(err => {
                                                                            console.error(strings.DB_ERROR, err)
                                                                            res.status(400).send(strings.DB_ERROR + err)
                                                                        })
                                                                } else {
                                                                    res.sendStatus(200)
                                                                }
                                                            })
                                                            .catch(err => {
                                                                console.error(strings.DB_ERROR, err)
                                                                res.status(400).send(strings.DB_ERROR + err)
                                                            })
                                                    })
                                                    .catch(err => {
                                                        console.error(strings.DB_ERROR, err)
                                                        res.status(400).send(strings.DB_ERROR + err)
                                                    })
                                            } else {
                                                res.sendStatus(204)
                                            }
                                        })
                                        .catch(err => {
                                            console.error(strings.DB_ERROR, err)
                                            res.status(400).send(strings.DB_ERROR + err)
                                        })
                                })
                                .catch(err => {
                                    console.error(strings.DB_ERROR, err)
                                    res.status(400).send(strings.DB_ERROR + err)
                                })
                        } else {
                            res.sendStatus(204)
                        }
                    })
                    .catch(err => {
                        console.error(strings.DB_ERROR, err)
                        res.status(400).send(strings.DB_ERROR + err)
                    })
            } else {
                console.error('[notification.approve] Notification not found:', req.params)
                res.sendStatus(204)
            }
        })
        .catch(err => {
            res.status(400).send(strings.DB_ERROR + err)
        })
}

export const decline = (req, res) => {
    Notification.findById(req.params.notificationId)
        .then(notification => {
            if (notification) {
                Connection.deleteOne({ _id: notification.senderConnection },
                    (err) => {
                        if (err) {
                            res.status(400).send(strings.DB_DELETE_ERROR + err)
                        } else {
                            Connection.deleteOne({ _id: notification.approverConnection },
                                (err) => {
                                    if (err) {
                                        res.status(400).send(strings.DB_DELETE_ERROR + err)
                                    } else {
                                        const isRead = notification.isRead
                                        notification.isRead = true
                                        notification.isConnected = false
                                        notification.isDeclined = true
                                        notification.save()
                                            .then(nn => {
                                                if (!isRead) {
                                                    NotificationCounter.findOne({ user: notification.user })
                                                        .then(counter => {
                                                            if (counter) {
                                                                counter.count = counter.count - 1
                                                                counter.save()
                                                                    .then(ct => {
                                                                        res.sendStatus(200)
                                                                    })
                                                                    .catch(err => {
                                                                        console.error(strings.DB_ERROR, err)
                                                                        res.status(400).send(strings.DB_ERROR + err)
                                                                    })
                                                            } else {
                                                                console.error('[notification.decline] Counter not found:', notification.user)
                                                                res.sendStatus(204)
                                                            }
                                                        })
                                                        .catch(err => {
                                                            console.error(strings.DB_ERROR, err)
                                                            res.status(400).send(strings.DB_ERROR + err)
                                                        })
                                                } else {
                                                    res.sendStatus(200)
                                                }
                                            })
                                            .catch(err => {
                                                res.status(400).send(strings.DB_ERROR + err)
                                            })
                                    }
                                })
                        }
                    })
            } else {
                console.error('[notification.decline] Notification not found:', req.params)
                res.sendStatus(204)
            }
        })
        .catch(err => {
            res.status(400).send(strings.DB_ERROR + err)
        })
}

export const getNotifications = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId(req.params.userId)
        const page = parseInt(req.params.page)
        const pageSize = parseInt(req.params.pageSize)

        const notifications = await Notification.aggregate([
            { $match: { user: userId } },
            {
                $lookup: {
                    from: 'BlockedUser',
                    let: { senderUserId: '$senderUser' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ['$user', '$$senderUserId'] }, { $eq: ['$blockedUser', userId] }]
                                }
                            }
                        }
                    ],
                    as: 'blockedUser'
                }
            },
            { $unwind: { path: '$blockedUser', preserveNullAndEmptyArrays: true } },
            { $match: { blockedUser: { $eq: undefined } } },
            {
                $lookup: {
                    from: 'Connection',
                    let: { senderConnectionId: '$senderConnection' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$_id', '$$senderConnectionId']
                                }
                            }
                        }
                    ],
                    as: 'senderConnection'
                }
            },
            { $unwind: { path: '$senderConnection', preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } },
            { $skip: ((page - 1) * pageSize) },
            { $limit: pageSize }
        ])

        res.json(notifications)
    } catch (err) {
        console.error(strings.DB_ERROR, err)
        res.status(400).send(strings.DB_ERROR + err)
    }
}

export const getNotification = (req, res) => {
    Notification.findOne({ user: req.params.userId, senderConnection: req.params.senderConnectionId, approverConnection: req.params.approverConnectionId })
        .then(notification => {
            if (notification) {
                res.json(notification)
            } else {
                console.error('[notification.get] Notification not found:', req.params)
                res.sendStatus(204)
            }
        })
        .catch(err => {
            res.status(400).send(strings.DB_ERROR + err)
        })
}

export const markAsRead = (req, res) => {
    Notification.findById(req.params.notificationId)
        .then(notification => {
            if (notification) {
                if (!notification.isRead) {
                    notification.isRead = true
                    notification.save()
                        .then(nn => {
                            NotificationCounter.findOne({ user: notification.user })
                                .then(counter => {
                                    if (counter) {
                                        counter.count = counter.count - 1
                                        counter.save()
                                            .then(ct => {
                                                res.sendStatus(200)
                                            })
                                            .catch(err => {
                                                console.error(strings.DB_ERROR, err)
                                                res.status(400).send(strings.DB_ERROR + err)
                                            })
                                    } else {
                                        console.error('[notification.markAsRead] Counter not found:', notification.user)
                                        res.sendStatus(204)
                                    }
                                })
                                .catch(err => {
                                    console.error(strings.DB_ERROR, err)
                                    res.status(400).send(strings.DB_ERROR + err)
                                })
                        })
                        .catch(err => {
                            console.error(strings.DB_ERROR, err)
                            res.status(400).send(strings.DB_ERROR + err)
                        })
                }
                else {
                    res.sendStatus(400)
                }
            } else {
                console.error('[notification.markAsRead] Notification not found:', req.params)
                res.sendStatus(204)
            }
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err)
            res.status(400).send(strings.DB_ERROR + err)
        })
}

export const markAllAsRead = (req, res) => {
    const bulk = Notification.collection.initializeOrderedBulkOp()
    bulk.find({ user: mongoose.Types.ObjectId(req.params.userId), isRead: false }).update({ $set: { isRead: true } })
    bulk.execute((err) => {
        if (err) {
            console.error(strings.DB_ERROR, err)
            res.status(400).send(strings.DB_ERROR + err)
        } else {
            NotificationCounter.findOne({ user: req.params.userId })
                .then(counter => {
                    if (counter) {
                        counter.count = 0
                        counter.save()
                            .then(ct => {
                                res.sendStatus(200)
                            })
                            .catch(err => {
                                console.error(strings.DB_ERROR, err)
                                res.status(400).send(strings.DB_ERROR + err)
                            })
                    } else {
                        console.error('[notification.markAllAsRead] Counter not found:', notification.user)
                        res.sendStatus(204)
                    }
                })
                .catch(err => {
                    console.error(strings.DB_ERROR, err)
                    res.status(400).send(strings.DB_ERROR + err)
                })
        }
    })
}

export const markAsUnRead = (req, res) => {
    Notification.findById(req.params.notificationId)
        .then(notification => {
            if (notification) {
                if (notification.isRead) {
                    notification.isRead = false
                    notification.save()
                        .then(nn => {
                            NotificationCounter.findOne({ user: notification.user })
                                .then(counter => {
                                    if (counter) {
                                        counter.count = counter.count + 1
                                        counter.save()
                                            .then(ct => {
                                                res.sendStatus(200)
                                            })
                                            .catch(err => {
                                                console.error(strings.DB_ERROR, err)
                                                res.status(400).send(strings.DB_ERROR + err)
                                            })
                                    } else {
                                        console.error('[notification.markAsUnRead] Counter not found:', notification.user)
                                        res.sendStatus(204)
                                    }
                                })
                                .catch(err => {
                                    console.error(strings.DB_ERROR, err)
                                    res.status(400).send(strings.DB_ERROR + err)
                                })
                        })
                        .catch(err => {
                            console.error(strings.DB_ERROR, err)
                            res.status(400).send(strings.DB_ERROR + err)
                        })
                } else {
                    res.sendStatus(400)
                }
            } else {
                console.error('[notification.markAsUnRead] Notification not found:', req.params)
                res.sendStatus(204)
            }
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err)
            res.status(400).send(strings.DB_ERROR + err)
        })
}

export const deleteNotification = (req, res) => {
    Notification.findByIdAndDelete(req.params.notificationId)
        .then(notification => {
            if (!notification.isRead) {
                NotificationCounter.findOne({ user: notification.user })
                    .then(counter => {
                        if (counter) {
                            counter.count = counter.count - 1
                            counter.save()
                                .then(ct => {
                                    res.sendStatus(200)
                                })
                                .catch(err => {
                                    console.error(strings.DB_ERROR, err)
                                    res.status(400).send(strings.DB_ERROR + err)
                                })
                        } else {
                            console.error('[notification.delete] Counter not found:', notification.user)
                            res.sendStatus(204)
                        }
                    })
                    .catch(err => {
                        console.error(strings.DB_ERROR, err)
                        res.status(400).send(strings.DB_ERROR + err)
                    })
            } else {
                res.sendStatus(200)
            }

        })
        .catch(err => {
            console.error(strings.DB_ERROR, err)
            res.status(400).send(strings.DB_ERROR + err)
        })
}

export const deleteAll = (req, res) => {
    Notification.deleteMany({ user: req.params.userId })
        .then(() => {
            NotificationCounter.findOne({ user: req.params.userId })
                .then(counter => {
                    if (counter) {
                        counter.count = 0
                        counter.save()
                            .then(ct => {
                                res.sendStatus(200)
                            })
                            .catch(err => {
                                console.error(strings.DB_ERROR, err)
                                res.status(400).send(strings.DB_ERROR + err)
                            })
                    } else {
                        console.error('[notification.deleteAll] Counter not found:', notification.user)
                        res.sendStatus(204)
                    }
                })
                .catch(err => {
                    console.error(strings.DB_ERROR, err)
                    res.status(400).send(strings.DB_ERROR + err)
                })
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err)
            res.status(400).send(strings.DB_ERROR + err)
        })
}

export const getNotificationCounter = (req, res) => {
    NotificationCounter.findOne({ user: req.params.userId })
        .then(counter => {
            if (counter) {
                res.json(counter)
            } else {
                const cnt = new NotificationCounter({ user: req.params.userId })
                cnt.save()
                    .then(n => {
                        res.json(cnt)
                    })
                    .catch(err => {
                        console.error(strings.DB_ERROR, err)
                        res.status(400).send(strings.DB_ERROR + err)
                    })
            }
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err)
            res.status(400).send(strings.DB_ERROR + err)
        })
}