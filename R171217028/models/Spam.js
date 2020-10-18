const mongoose = require('mongoose');

let bySubSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { _id: false });

let spamSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    by: [bySubSchema],
    blocked: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    modifiedOn: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model('Spam', spamSchema);