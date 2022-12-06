import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const connectionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    connection: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    isApprover: {
        type: Boolean,
        required: true
    },
    isPending: {
        type: Boolean,
        default: true
    },
    connectedAt: {
        type: Date
    }
}, {
    strict: true,
    collection: 'Connection'
});

connectionSchema.index({ user: 1, connection: 1 }, { unique: true });

const connectionModel = mongoose.model('Connection', connectionSchema);

connectionModel.on('index', (err) => {
    if (err) {
        console.error('Connection index error: %s', err);
    } else {
        console.info('Connection indexing complete');
    }
});

export default connectionModel;