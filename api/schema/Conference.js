import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const conferenceSchema = new Schema({
    title: {
        type: String,
        required: [true, "can't be blank"],
        index: true
    },
    description: {
        type: String,
        index: true
    },
    isPrivate: {
        type: Boolean,
        default: true
    },
    isLive: {
        type: Boolean,
        default: false
    },
    speaker: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    broadcastedAt: {
        type: Date
    },
    finishedAt: {
        type: Date
    },
}, {
    timestamps: true,
    strict: true,
    collection: 'Conference'
});

const conferenceModel = mongoose.model('Conference', conferenceSchema);

conferenceModel.on('index', (err) => {
    if (err) {
        console.error('Conference index error: %s', err);
    } else {
        console.info('Conference indexing complete');
    }
});

export default conferenceModel;