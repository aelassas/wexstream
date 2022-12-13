import User from '../models/User.js';
import Connection from '../models/Connection.js';
import authJwt from '../middlewares/authJwt.js';
import strings from '../config/app.config.js';
import mongoose from 'mongoose';

export const connect =  (req, res) => {
    User.findById(req.body._id)
        .then((user) => {
            if (user) {
                User.findById(req.body.connectionId)
                    .then(connectionUser => {
                        if (!connectionUser) {
                            console.log('[connection.connect] Connection user not found:', req.body.connectionId);
                            res.sendStatus(204);
                        } else {
                            Connection.findOne({ user: req.body._id, connection: req.body.connectionId })
                                .then((senderConnection) => {
                                    if (!senderConnection) {
                                        const senderConn = new Connection({ user: req.body._id, connection: req.body.connectionId, isApprover: false });
                                        senderConn.save();
                                        Connection.findOne({ user: req.body.connectionId, connection: req.body._id })
                                            .then((approverConnection) => {
                                                if (!approverConnection) {
                                                    const approverConn = new Connection({ user: req.body.connectionId, connection: req.body._id, isApprover: true });
                                                    approverConn.save();
                                                    res.json({ _senderConnectionId: senderConn._id, _approverConnectionId: approverConn._id });
                                                } else {
                                                    console.log('[connection.connect] Approver connection already exists:', req.body);
                                                    res.sendStatus(400);
                                                }
                                            });
                                    } else {
                                        console.log('[connection.connect] Sender connection already exists:', req.body);
                                        res.sendStatus(400);
                                    }
                                });
                        }
                    });
            } else {
                console.log('[connection.connect] User not found:', req.body._id);
                res.sendStatus(204);
            }
        });
};

export const get = (req, res) => {
    Connection.findOne({ user: req.params.userId, connection: req.params.connectionId })
        .then((connection) => {
            if (!connection) {
                console.log('[connection.get] Connection not found:', req.params);
                res.sendStatus(204);
            } else {
                res.json(connection);
            }
        });
};

export const getConnectionIds=(req, res) => {
    Connection.findOne({ user: req.params.userId, connection: req.params.connectionId })
        .then((senderConnection) => {
            if (!senderConnection) {
                console.log('[connection.getConnectionIds] Sender connection not found:', req.params);
                res.sendStatus(204);
            } else {
                Connection.findOne({ user: req.params.connectionId, connection: req.params.userId })
                    .then((approverConnection) => {
                        if (!approverConnection) {
                            console.log('[connection.getConnectionIds] Approver connection not found:', req.params);
                            res.sendStatus(204);
                        } else {
                            res.json({ _senderConnectionId: senderConnection._id, _approverConnectionId: approverConnection._id });
                        }
                    });
            }
        });
};

export const deleteConnection = (req, res) => {
    Connection.deleteOne({ user: req.params.userId, connection: req.params.connectionId },
        (err, senderRes) => {
            if (err) {
                console.error(strings.DB_DELETE_ERROR, err);
                res.status(400).send(strings.DB_DELETE_ERROR + err);
            } else {
                Connection.deleteOne({ user: req.params.connectionId, connection: req.params.userId },
                    (err, approverRes) => {
                        if (err) {
                            res.status(400).send(strings.DB_DELETE_ERROR + err);
                        } else {
                            res.sendStatus(200);
                        }
                    });
            }
        });
};

export const getConnection = (req, res) => {
    Connection.findById(req.params.connectionId)
        .then((connection) => {
            if (!connection) {
                console.log('[connection.get] Connection not found:', req.params);
                res.sendStatus(204);
            } else {
                res.json(connection);
            }
        });
};

export const getConnections = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId(req.params.userId);
        const page = parseInt(req.params.page);
        const pageSize = parseInt(req.params.pageSize);

        const user = await User.findById(req.params.userId);
        
        const connections = await Connection.aggregate([
            { $match: { connection: userId } },
            {
                $lookup: {
                    from: 'BlockedUser',
                    let: { userId: '$user' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ['$user', '$$userId'] }, { $eq: ['$blockedUser', userId] }]
                                }
                            },
                        }
                    ],
                    as: 'blockedUser'
                }
            },
            { $unwind: { path: '$blockedUser', preserveNullAndEmptyArrays: true } },
            { $match: { blockedUser: { $eq: undefined } } },
            {
                $lookup: {
                    from: 'User',
                    let: { userId: '$user' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ['$_id', '$$userId'] }, { $eq: ['$blacklisted', false] }]
                                }
                            },
                        }
                    ],
                    as: 'user'
                }
            },
            { $unwind: { path: '$user' } },
            { $sort: { 'user.fullName': 1 } },
            { $skip: ((page - 1) * pageSize) },
            { $limit: pageSize }
        ], { collation: { locale: user.language, strength: 2 } });
        res.json(connections);
    } catch (err) {
        console.error(strings.DB_ERROR, err);
        res.status(400).send(strings.DB_ERROR + err);
    }
};