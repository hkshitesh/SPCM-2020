const mongoose = require('mongoose')

const Schema = mongoose.Schema

let chatSchema = new Schema({

    chatId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    senderName: {
        type: String,
        default: ''
    },
    senderId: {
        type: String,
        required: true
    },
    receiverName: {
        type: String,
        default: ''
    },
    receiverId: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    seen: {
        type: Boolean,
        default: false
    },
    delivered: {
        type: Boolean,
        default: false
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

module.exports = mongoose.model('SingleChat', chatSchema);