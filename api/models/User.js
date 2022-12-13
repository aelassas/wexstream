import validator from 'validator';
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const userSchema = new Schema({
    googleId: {
        type: String
    },
    facebookId: {
        type: String
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: [true, "can't be blank"],
        validate: [validator.isEmail, 'is invalid'],
        index: true
    },
    fullName: {
        type: String,
        required: [true, "can't be blank"],
        index: true
    },
    password: {
        type: String
    },
    verified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    },
    blacklisted: {
        type: Boolean,
        default: false
    },
    language: { // ISO 639-1 (alpha-2 code)
        type: String,
        default: process.env.WS_DEFAULT_LANGUAGE,
        lowercase: true,
        minlength: 2,
        maxlength: 2
    },
    enableEmailNotifications: {
        type: Boolean,
        default: true
    },
    enablePrivateMessages: {
        type: Boolean,
        default: true
    },
    avatar: {
        type: String
    },
    bio: {
        type: String,
        maxlength: 100
    },
    location: {
        type: String
    },
    website: {
        type: String,
        validate: {
            validator: value => value === '' || validator.isURL(value, { require_tld: true, require_protocol: false }),
            message: 'Must be a Valid URL'
        }
    }
}, {
    timestamps: true,
    strict: true,
    collection: 'User'
});

const userModel = mongoose.model('User', userSchema);

userModel.on('index', (err) => {
    if (err) {
        console.error('User index error: %s', err);
    } else {
        console.info('User indexing complete');
    }
});

export default userModel;