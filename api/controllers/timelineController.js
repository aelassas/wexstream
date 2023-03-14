import Timeline from '../models/Timeline.js'
import User from '../models/User.js'
import Conference from '../models/Conference.js'
import Notification from '../models/Notification.js'
import NotificationCounter from '../models/NotificationCounter.js'
import Connection from '../models/Connection.js'
import strings from '../config/app.config.js'
import mongoose from 'mongoose'
import { escapeRegex } from '../common/helper.js'

const HTTPS = process.env.WS_HTTPS.toLowerCase() === 'true'
const APP_HOST = process.env.WS_APP_HOST

export const create = (req, res) => {
    Connection.find({ connection: req.params.speakerId, isPending: false })
        .populate('user')
        .then(connections => {
            User.findById(req.params.speakerId).then(
                speaker => {
                    if (speaker) {
                        Conference.findById(req.params.conferenceId)
                            .then(conference => {
                                const conferenceUrl = `${'http' + (HTTPS ? 's' : '') + ':\/\/' + APP_HOST}/conference?c=${conference._id}`
                                const regex = escapeRegex(conference._id.toString())

                                if (conference) {
                                    connections.forEach(connection => {
                                        Timeline.findOne({ speaker: req.params.speakerId, subscriber: connection.user._id, conference: req.params.conferenceId })
                                            .then(entry => {
                                                if (!entry) {
                                                    const timelineEntry = new Timeline({ speaker: req.params.speakerId, subscriber: connection.user._id, conference: req.params.conferenceId })
                                                    timelineEntry.save().then(() => {
                                                        if (req.params.isStarted) {
                                                            Notification.findOne({ $and: [{ user: connection.user._id }, { $or: [{ message: { $regex: regex, $options: 'i' } }, { link: { $regex: regex, $options: 'i' } }] }] })
                                                                .then(notification => {
                                                                    if (!notification) {
                                                                        strings.setLanguage(connection.user.language)

                                                                        const data = {
                                                                            user: connection.user._id,
                                                                            isRequest: false,
                                                                            message: `${speaker.fullName} ${strings.CONFERENCE_NOTIFICATION} "${conference.title}".`,
                                                                            isLink: true,
                                                                            link: conferenceUrl
                                                                        }
                                                                        const notification = new Notification(data)
                                                                        notification.save().then(() => {
                                                                            NotificationCounter.findOne({ user: notification.user })
                                                                                .then(counter => {
                                                                                    if (counter) {
                                                                                        counter.count = counter.count + 1
                                                                                        counter.save()
                                                                                            .catch(err => {
                                                                                                console.error(strings.DB_ERROR, err)
                                                                                            })
                                                                                    } else {
                                                                                        const cnt = new NotificationCounter({ user: notification.user, count: 1 })
                                                                                        cnt.save()
                                                                                            .catch(err => {
                                                                                                console.error(strings.DB_ERROR, err)
                                                                                            })
                                                                                    }
                                                                                })
                                                                                .catch(err => {
                                                                                    console.error(strings.DB_ERROR, err)
                                                                                })
                                                                        })
                                                                    }
                                                                })
                                                        }
                                                    })
                                                }
                                            })
                                    })
                                }
                            })
                    }
                })

            res.sendStatus(200)
        })
        .catch(err => {
            console.error(strings.DB_ERROR, err)
            res.status(400).send(strings.DB_ERROR + err)
        })
}

export const deleteSpeakerEntries = (req, res) => {
    Timeline.deleteMany({ speaker: req.params.speakerId, conference: req.params.conferenceId })
        .then(() => res.sendStatus(200))
        .catch(err => {
            console.error(strings.DB_ERROR, err)
            res.status(400).send(strings.DB_ERROR + err)
        })
}

export const deleteSubscriberEntry = (req, res) => {
    Timeline.deleteOne({ _id: req.params.entryId })
        .then(() => res.sendStatus(200))
        .catch(err => {
            console.error(strings.DB_ERROR, err)
            res.status(400).send(strings.DB_ERROR + err)
        })
}

export const getEntries = async (req, res) => {
    try {
        const page = parseInt(req.params.page)
        const pageSize = parseInt(req.params.pageSize)

        const entries = await Timeline.aggregate([
            { $match: { subscriber: new mongoose.Types.ObjectId(req.params.subscriberId) } },
            {
                $lookup: {
                    from: 'User',
                    let: { userId: '$speaker' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ['$_id', '$$userId'] }, { $eq: ['$blacklisted', false] }]
                                }
                            },
                        }
                    ],
                    as: 'speaker'
                }
            },
            {
                $lookup: {
                    from: 'Conference',
                    let: { conferenceId: '$conference' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ['$_id', '$$conferenceId'] }]
                                }
                            },
                        }
                    ],
                    as: 'conference'
                }
            },
            { $unwind: { path: '$speaker' } },
            { $unwind: { path: '$conference' } },
            { $sort: { createdAt: -1 } },
            { $skip: ((page - 1) * pageSize) },
            { $limit: pageSize }
        ])
        res.json(entries)
    } catch (err) {
        console.error(strings.DB_ERROR, err)
        res.status(400).send(strings.DB_ERROR + err)
    }
}