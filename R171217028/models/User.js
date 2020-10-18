const mongoose = require('mongoose');

let blockedSubSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    blockedOn: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

let groupSubSchema = new mongoose.Schema({
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }
}, { _id: false });

let userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobileNumber: {
        type: Number,
        default: 0,
        unique: true
    },
    blocked: [blockedSubSchema],
    groups: [groupSubSchema],
    lastSeen: {
        type: Date
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    modifiedOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);