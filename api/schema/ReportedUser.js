import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const reportedUserSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    reportedUser: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    reports: [{
        type: Schema.Types.ObjectId,
        ref: 'Report'
    }]
}, {
    strict: true,
    collection: 'ReportedUser'
});

reportedUserSchema.index({ user: 1, reportedUser: 1 }, { unique: true });

const reportedUserModel = mongoose.model('ReportedUser', reportedUserSchema);

reportedUserModel.on('index', (err) => {
    if (err) {
        console.error('ReportedUser index error: %s', err);
    } else {
        console.info('ReportedUser indexing complete');
    }
});

export default reportedUserModel;