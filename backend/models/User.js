const mongoose = require('mongoose');
const { Schema } = require('mongoose');


const userSchema = new Schema({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: [true, 'Duplicate Email']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'admin', 'instructor'],
        default: 'student'
    },

    phoneNumber: {
        type: String
    },

    rating: {
        type: Number,
        default: 0
    },

    //for instructor verification
    isVerified: {
        type: Boolean,
        default: false
    },

    totalRatings: {
        type: Number,
        default: 0
    },

    //experience in years for industry experts
    experience: {
        type: Number
    },

    domains: [String],

    bio: {
        type: String
    },

    avatar: {
        type: String
    },

    resume: {
        type: String // Path to uploaded file
    },



    github: {
        type: String
    },

    statusForSession: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    },

    sessionsAttended: {
        type: Number,
        default: 0
    },

    sessionsTaken: {
        type: Number,
        default: 0
    },

    minutesTaught: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});

// Indexes for performance optimization
userSchema.index({ role: 1 });
userSchema.index({ role: 1, isVerified: 1 });
userSchema.index({ domains: 1 });
userSchema.index({ statusForSession: 1 });



module.exports = mongoose.model('User', userSchema);