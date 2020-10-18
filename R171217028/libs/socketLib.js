const socketio = require('socket.io');
const mongoose = require('mongoose');
const shortid = require('shortid');
const events = require('events');

const eventEmitter = new events.EventEmitter();

//Libraries
const token = require("./tokenLib");
const redis = require("./redisLib");
const check = require("./checkLib");
const time = require("./timeLib");

//Models
const SingleChatModel = mongoose.model('SingleChat');
const GroupChatModel = mongoose.model('GroupChat');
const UserModel = mongoose.model('User');


let setServer = (server) => {

    let io = socketio.listen(server);

    let myIo = io.of('/'); //Namespaces '/' -> for creating multilple RTC in single website with different namspace

    myIo.on('connection', (socket) => { //All events should be inside this connection

        //socket.emit("<event name>",<data>)  -> triggering an event on client side
        //scoket.on("<event name", <callback function>) -> listening to an event from client side

        socket.emit("verifyUser", "");
        //-------------------------------------------------
        socket.on('set-user', (authToken, userId) => {

            console.log("set user called");

            token.verifyTokenFromDatabase(authToken)
                .then((user) => {
                    console.log("user is verified..setting details");
                    let currentUser = user.data;
                    if (currentUser.userId != userId)
                        reject("authToken not correct");

                    socket.userId = currentUser.userId // setting socket user id to identify it further
                    let fullName = `${currentUser.firstName} ${currentUser.lastName}`

                    let key = currentUser.userId
                    let value = authToken

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {

                            let timeout = 0;

                            if (result[key]) { //check whether user is already logged somewhere

                                console.log(`${fullName} is already online`);
                                myIo.emit('auth-error@' + result[key], { status: 500, error: 'Already logged somewhere' });
                                timeout = 500;

                            }

                            setTimeout(function() {

                                redis.setANewOnlineUserInHash("onlineUsers", key, value)
                                    .then((res) => {

                                        redis.getAllUsersInAHash('onlineUsers')
                                            .then((result) => {
                                                console.log(`${fullName} is online`);
                                                let users = Object.keys(result);
                                                for (let u = 0; u < users.length; u++) {
                                                    getObjectID(users[u])
                                                        .then(getBlockedUsers)
                                                        .then(getFriends)
                                                        .then((friends) => {
                                                            for (let i = 0; i < friends.length; i++) {
                                                                if (result[friends[i].userId])
                                                                    myIo.emit('online-user@' + result[friends[i].userId], users[u]);
                                                            }
                                                        })
                                                        .catch((err) => {
                                                            console.log(err);
                                                        });
                                                }
                                            })
                                            .catch((err) => {
                                                console.log(err);
                                            });

                                    })
                                    .catch((err) => {
                                        console.log(err);
                                    });

                            }, timeout);

                        })
                        .catch((err) => {
                            console.log(err);
                        });
                }).catch((err) => {
                    console.log("Auth Error:" + err);
                    socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' })
                });
        });
        //-------------------------------------------------
        socket.on('configure-groups', (data) => {
            let groups = data.groups;

            token.verifyTokenFromDatabase(data.authToken).then((user) => { //To check whether the user authToken exists

                if (user.data.userId == data.userId) {
                    for (let i = 0; i < groups.length; i++) {
                        // joining chat-group room.
                        socket.join(groups[i].group_id.groupId);
                    }
                    console.log("Groups configured");
                } else {
                    console.log("Somewhen tried to send message using " + chatMessage.senderId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' })
            });
        });
        //-------------------------------------------------
        socket.on('single-chat-msg', (data) => {
            let chatMessage = data.chatMessage;

            token.verifyTokenFromDatabase(data.authToken).then((user) => { //To check whether the user authToken exists

                if (user.data.userId == chatMessage.senderId) {
                    chatMessage['chatId'] = shortid.generate();
                    myIo.emit("getChatId@" + data.authToken, chatMessage['chatId']);
                    console.log("Message received:" + chatMessage);

                    setTimeout(function() { //save chat after one second delay

                        eventEmitter.emit('save-single-chat', chatMessage);

                    }, 1000);

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {
                            checkBlocked(chatMessage.receiverId, chatMessage.senderId)
                                .then((isBlocked) => {
                                    if (!isBlocked)
                                        myIo.emit("receive-single@" + result[chatMessage.receiverId], chatMessage);
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to send message using " + chatMessage.senderId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' })
            });
        });

        //-------------------------------------------------
        socket.on('group-chat-msg', (data) => {
            let chatMessage = data.chatMessage;

            token.verifyTokenFromDatabase(data.authToken).then((user) => { //To check whether the user authToken exists

                if (user.data.userId == chatMessage.senderId) {
                    chatMessage['chatId'] = shortid.generate();
                    myIo.emit("getChatId@" + data.authToken, chatMessage['chatId']);

                    setTimeout(function() { //save chat after one second delay

                        eventEmitter.emit('save-group-chat', chatMessage);

                    }, 1000);

                    socket.to(chatMessage.groupId).broadcast.emit("receive-group", chatMessage);

                } else {
                    console.log("Somewhen tried to send message using " + chatMessage.senderId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' })
            });
        });
        //-------------------------------------------------
        socket.on('typing-single', (data) => {

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.senderId) {

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {
                            checkBlocked(data.senderId, data.receiverId)
                                .then((isBlocked) => {
                                    if (!isBlocked) {
                                        myIo.emit('typing-single@' + result[data.receiverId], data.senderId);
                                    }
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to check typing status using " + data.senderId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });
        });
        //-------------------------------------------------
        socket.on('typing-group', (data) => {

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.senderId) {
                    socket.to(data.groupId).broadcast.emit("typing-group", { groupId: data.groupId, senderName: data.senderName });
                } else {
                    console.log("Somewhen tried to check typing status using " + data.senderId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });
        });

        //-------------------------------------------------
        socket.on('added-to-group', (data) => {

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.userId) {
                    let group = data.group;
                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {
                            for (let i = 0; i < group.members.length; i++) {
                                myIo.emit('added-to-group@' + result[group.members[i].user_id.userId], group);
                            }
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to send removed from group status using " + data.userId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });

        });

        //-------------------------------------------------
        socket.on('removed-from-group', (data) => {

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.userId) {
                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {
                            myIo.emit('removed-from-group@' + result[data.memberId], data.groupId);
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to send removed from group status using " + data.userId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });

        });

        //-------------------------------------------------
        socket.on('delivered-single', (data) => {

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.receiverId) {

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {
                            myIo.emit('delivered-single@' + result[data.senderId], { chatIds: data.chatIds, receiverId: data.receiverId });
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to mark delivered status using " + data.receiverId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });
        });

        //-------------------------------------------------
        socket.on('delivered-group', (data) => {

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.receiverId) {

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {

                            let senderId = data.senderIds[0];
                            let chatIds = Array();

                            for (let i = 0; i < data.senderIds.length; i++) {

                                chatIds.push(data.chatIds[i]);
                                if (senderId != data.senderIds[i] ||
                                    i == data.senderIds.length - 1) {
                                    socket.to(data.groupId)
                                        .broadcast.emit("delivered-group@" + result[senderId], { groupId: data.groupId, chatIds: chatIds, receiverId: data.receiverId, receiverName: data.receiverName, createdOn: data.createdOn });
                                    senderId = data.senderIds[i];
                                    chatIds = Array();
                                }

                            }

                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to mark delivered status using " + data.receiverId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });
        });

        //-------------------------------------------------
        socket.on('seen-single', (data) => {

            console.log('Seen Message: ' + JSON.stringify(data));

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.receiverId) {

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {
                            myIo.emit('seen-single@' + result[data.senderId], { chatIds: data.chatIds, receiverId: data.receiverId });
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to mark seen status using " + data.receiverId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });
        });

        //-------------------------------------------------
        socket.on('seen-group', (data) => {

            console.log('Seen Message: ' + JSON.stringify(data));

            token.verifyTokenFromDatabase(data.authToken).then((user) => {

                if (user.data.userId == data.receiverId) {

                    redis.getAllUsersInAHash('onlineUsers')
                        .then((result) => {
                            let senderId = data.senderIds[0];
                            let chatIds = Array();

                            for (let i = 0; i < data.senderIds.length; i++) {

                                chatIds.push(data.chatIds[i]);
                                if (senderId != data.senderIds[i] ||
                                    i == data.senderIds.length - 1) {
                                    socket.to(data.groupId)
                                        .broadcast.emit("seen-group@" + result[senderId], { groupId: data.groupId, chatIds: chatIds, receiverId: data.receiverId, receiverName: data.receiverName, modifiedOn: data.modifiedOn });
                                    senderId = data.senderIds[i];
                                    chatIds = Array();
                                }

                            }
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    console.log("Somewhen tried to mark seen status using " + data.receiverId + " id");
                }
            }).catch((err) => {
                console.log("Auth Error:" + err);
                socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
            });
        });

        //-------------------------------------------------
        socket.on('disconnect', () => { // disconnect the user from socket

            console.log(`${socket.userId} is disconnected`);
            let userData = {
                userId: socket.userId,
                lastSeen: time.now()
            }

            if (socket.userId) {
                redis.deleteUserFromHash('onlineUsers', socket.userId);
                redis.getAllUsersInAHash('onlineUsers')
                    .then((result) => {

                        getObjectID(socket.userId)
                            .then(getBlockedUsers)
                            .then(getFriends)
                            .then((friends) => {
                                for (let i = 0; i < friends.length; i++) {
                                    if (result[friends[i].userId])
                                        myIo.emit('last-seen@' + result[friends[i].userId], userData);
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                            });

                        setTimeout(function() { //save lastSeen after one second delay

                            eventEmitter.emit('save-last-seen', userData);

                        }, 1000);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }

        });
    });
}


/* Database operations are kept outside of socket.io code. */

// Saving chats to database.
eventEmitter.on('save-single-chat', (data) => {

    let newChat = new SingleChatModel({

        chatId: data.chatId,
        senderName: data.senderName,
        senderId: data.senderId,
        receiverName: data.receiverName || '',
        receiverId: data.receiverId || '',
        message: data.message,
        chatRoom: data.chatRoom || '',
        createdOn: data.createdOn

    });

    newChat.save()
        .then((result) => {
            if (check.isEmpty(result)) {
                console.error("Chat is not saved");
            } else {
                console.info("Chat saved");
            }
        })
        .catch((err) => {
            console.error(`Error occurred: ${err}`);
        });

});

// Saving chats to database.
eventEmitter.on('save-group-chat', (data) => {

    let newChat = new GroupChatModel({

        chatId: data.chatId,
        groupId: data.groupId,
        groupName: data.groupName,
        senderName: data.senderName,
        senderId: data.senderId,
        message: data.message

    });

    newChat.save()
        .then((result) => {
            if (check.isEmpty(result)) {
                console.error("Group Chat is not saved");
            } else {
                console.info("Group Chat saved");
            }
        })
        .catch((err) => {
            console.error(`Error occurred: ${err}`);
        });

});

// Saving lastSeen of user to database.
eventEmitter.on('save-last-seen', (data) => {

    UserModel.update({ userId: data.userId }, { lastSeen: data.lastSeen })
        .then((result) => {
            if (result.n == 0) {
                console.error("Last seen is not saved");
            } else {
                console.info("Last seen saved");
            }
        })
        .catch((err) => {
            console.error(`Error occurred: ${err}`);
        });

});

let getObjectID = (userId) => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ userId: userId }, { blocked: 1, _id: 1 })
            .populate('blocked.user_id', '-_id userId')
            .exec()
            .then((user) => {
                if (check.isEmpty(user)) {
                    reject('No User Found');
                } else {
                    let blockedUsers = Array();
                    for (let i = 0; i < user.blocked.length; i++) {
                        blockedUsers.push(user.blocked[i].user_id.userId);
                    }
                    resolve({ userId: userId, user_id: user._id, blockedUsers: blockedUsers });
                }
            })
            .catch((err) => {
                reject(err.message);
            });
    });
}
let getBlockedUsers = (data) => {
    return new Promise((resolve, reject) => {
        let user_id = data.user_id;
        let userId = data.userId;
        let blockedUsers = data.blockedUsers;
        UserModel.find({ "blocked.user_id": { $eq: user_id } }, { userId: 1, _id: 0 })
            .exec()
            .then((users) => {
                for (let i = 0; i < users.length; i++) {
                    blockedUsers.push(users[i].userId);
                }
                resolve({ userId: userId, blockedUsers: blockedUsers });
            })
            .catch((err) => {
                reject(err.message);
            });
    });
}

let getFriends = (data) => {
    return new Promise((resolve, reject) => {
        let userId = data.userId;
        let blockedUsers = data.blockedUsers;

        SingleChatModel.aggregate([{
                "$match": {
                    "$or": [{
                        "senderId": userId
                    }, {
                        "receiverId": userId
                    }]
                }
            },
            {
                "$sort": {
                    "createdOn": -1
                }
            },
            {
                "$group": {
                    "_id": {
                        "userId": {
                            $cond: {
                                if: {
                                    $eq: ["$senderId", userId]
                                },
                                then: "$receiverId",
                                else: "$senderId"
                            }
                        }
                    }
                }
            },
            {
                "$project": {
                    "userId": "$_id.userId",
                    "_id": 0
                }
            }, {
                "$match": {
                    "userId": { $nin: blockedUsers }
                },
            }
        ]).then((friends) => {
            resolve(friends);
        }).catch((err) => {
            reject(err.message);
        });
    });
}


let checkBlocked = (receiverId, senderId) => { //check whether receiver has blocked sender or vice versa
    return new Promise((resolve, reject) => {
        UserModel.findOne({ userId: receiverId }).populate('blocked.user_id', '-_id userId')
            .then((user) => {
                let isBlocked = false;
                for (let i = 0; i < user.blocked.length; i++) {
                    if (user.blocked[i].user_id.userId == senderId) {
                        isBlocked = true;
                        break;
                    }
                }
                if (isBlocked) {
                    resolve(true);
                } else {
                    UserModel.findOne({ userId: senderId }).populate('blocked.user_id', '-_id userId')
                        .then((user) => {
                            for (let i = 0; i < user.blocked.length; i++) {
                                if (user.blocked[i].user_id.userId == receiverId) {
                                    isBlocked = true;
                                    break;
                                }
                            }
                            if (isBlocked)
                                resolve(true);
                            else
                                resolve(false);
                        }).catch((err) => {
                            reject(err.message);
                        });
                }
            }).catch((err) => {
                reject(err.message);
            });

    });
}

module.exports = {
    setServer: setServer
}