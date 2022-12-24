import mongoose from 'mongoose'

const Schema = mongoose.Schema

const reportSchema = new Schema({
    reportedAt: {
        type: Date,
        default: Date.now
    },
    message: {
        type: Schema.Types.String,
        required: [true, "can't be blank"]
    }
}, {
    strict: true,
    collection: 'Report'
})

const reportModel = mongoose.model('Report', reportSchema)

reportModel.on('index', (err) => {
    if (err) {
        console.error('Report index error: %s', err)
    } else {
        console.info('Report indexing complete')
    }
})

export default reportModel