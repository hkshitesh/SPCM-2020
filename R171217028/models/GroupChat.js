const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let receiverSubSchema = new Schema({

    receiverName: {
        type: String,
        required: true
    },
    receiverId: {
        type: String,
        required: true
    },
    delivered: {
        type: Boolean,
        default: false
    },
    seen: {
        type: Boolean,
        default: false
    },
    modifiedOn: {
        type: Date,
        default: Date.now
    },
    createdOn: {
        type: Date,
        default: Date.now
    }

}, { _id: false });

let chatSchema = new Schema({

    chatId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    groupId: {
        type: String,
        required: true
    },
    groupName: {
        type: String,
        required: true
    },
    senderName: {
        type: String,
        required: true,
    },
    senderId: {
        type: String,
        required: true
    },
    receiver: [receiverSubSchema],
    message: {
        type: String,
        required: true
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

module.exports = mongoose.model('GroupChat', chatSchema);