import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const timelineSchema = new Schema({
    speaker: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    subscriber: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    conference: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Conference'
    }
}, {
    timestamps: true,
    strict: true,
    collection: 'Timeline'
});

const timelineModel = mongoose.model('Timeline', timelineSchema);

timelineModel.on('index', (err) => {
    if (err) {
        console.error('Timeline index error: %s', err);
    } else {
        console.info('Timeline indexing complete');
    }
});

export default timelineModel;