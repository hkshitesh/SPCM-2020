const mongoose = require('mongoose')

const Schema = mongoose.Schema

let membersSubSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admin: {
        type: Boolean,
        default: false
    },
    joinedOn: {
        type: Date,
        default: Date.now
    },
    modifiedOn: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

let groupSchema = new Schema({

    groupId: {
        type: String,
        index: true,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    members: [membersSubSchema],
    createdOn: {
        type: Date,
        default: Date.now
    },
    modifiedOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Group', groupSchema);