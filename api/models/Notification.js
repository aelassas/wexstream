import mongoose from 'mongoose'
import validator from 'validator'

const Schema = mongoose.Schema

const notificationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    message: {
        type: String,
        required: true
    },
    isRequest: {
        type: Boolean,
        default: false
    },
    senderConnection: {
        type: Schema.Types.ObjectId,
        ref: 'Connection'
    },
    senderUser: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    approverConnection: {
        type: Schema.Types.ObjectId,
        ref: 'Connection'
    },
    notifiedAt: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isConnected: {
        type: Boolean,
        default: false
    },
    isDeclined: {
        type: Boolean,
        default: false
    },
    isLink: {
        type: Boolean,
        default: false
    },
    link: {
        type: String,
        validate: {
            validator: value => validator.isURL(value, { protocols: ['http', 'https'], require_tld: false, require_protocol: true }),
            message: 'Must be a Valid URL'
        }
    },
}, {
    timestamps: true,
    strict: true,
    collection: 'Notification'
})

const notificationModel = mongoose.model('Notification', notificationSchema)

notificationModel.on('index', (err) => {
    if (err) {
        console.error('Notification index error: %s', err)
    } else {
        console.info('Notification indexing complete')
    }
})

export default notificationModel