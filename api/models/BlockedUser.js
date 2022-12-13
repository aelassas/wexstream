import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const blockedUserSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    blockedUser: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    blockedAt: {
        type: Schema.Types.Date,
        default: Date.now
    }
}, {
    strict: true,
    collection: 'BlockedUser'
});

blockedUserSchema.index({ user: 1, blockedUser: 1 }, { unique: true });

const blockedUserModel = mongoose.model('BlockedUser', blockedUserSchema);

blockedUserModel.on('index', (err) => {
    if (err) {
        console.error('BlockedUser index error: %s', err);
    } else {
        console.info('BlockedUser indexing complete');
    }
});

export default blockedUserModel;