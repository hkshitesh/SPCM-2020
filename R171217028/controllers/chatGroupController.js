const mongoose = require('mongoose');

//Libraries
const response = require('../libs/responseLib');
const logger = require('../libs/loggerLib');
const check = require('../libs/checkLib');
const time = require('../libs/timeLib');

//Models
const ChatModel = mongoose.model('GroupChat');
const UserModel = mongoose.model('User');
const GroupModel = mongoose.model('Group');


let chatGroupController = {

    getGroupSeenChat: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.groupId)) {
                    logger.error('Parameters Missing', 'chatGroupController: getGroupSeenChat(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatGroupController: getGroupSeenChat(): validateParams()', 9);
                    resolve()
                }
            });
        }

        let findUserAndGetObjectId = () => {
            return new Promise((resolve, reject) => {

                UserModel.findOne({ userId: req.user.userId })
                    .select('_id')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.error('No User Found', 'chatGroupController: findUserAndGetObjectId()', 7);
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('User Found', 'chatGroupController: findUserAndGetObjectId()', 10);
                            req.user._id = user._id
                            resolve();
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: findUserAndGetObjectId()', 10);
                        reject(response.generate(true, 'Failed to find user', 500, null));
                    });
            });
        }

        let getGroupJoinedOn = () => {
            return new Promise((resolve, reject) => {
                GroupModel.findOne({
                        groupId: req.query.groupId,
                        members: {
                            $elemMatch: {
                                "user_id": req.user._id
                            }
                        }
                    }, { _id: 0, "members.$": 1 })
                    .then((group) => {
                        if (check.isEmpty(group)) {
                            logger.error('No Group Found', 'chatGroupController: getGroupJoinedOn()', 7);
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('Group Found', 'chatGroupController: getGroupJoinedOn()', 10);
                            resolve(group.members[0].joinedOn);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: getGroupJoinedOn()', 10);
                        reject(response.generate(true, 'Failed to find group', 500, null));
                    });
            });
        }

        let findChats = (joinedOn) => {
            return new Promise((resolve, reject) => {

                ChatModel.aggregate([{
                            $match: {
                                groupId: req.query.groupId,
                                createdOn: { $gte: joinedOn },
                                $or: [{
                                    receiver: {
                                        $elemMatch: {
                                            "receiverId": req.user.userId,
                                            "delivered": true,
                                            "seen": true
                                        }
                                    }
                                }, {
                                    senderId: req.user.userId
                                }]
                            },
                        },
                        {
                            $sort: {
                                createdOn: -1
                            }
                        },
                        {
                            $skip: parseInt(req.query.skip) || 0
                        },
                        {
                            $limit: 10
                        },
                        {
                            $project: {
                                _id: 0,
                                chatId: '$chatId',
                                message: '$message',
                                createdOn: '$createdOn',
                                senderId: '$senderId',
                                senderName: '$senderName',
                                receiver: {
                                    $cond: {
                                        if: {

                                            $eq: ['$senderId', req.user.userId]
                                        },
                                        then: '$receiver',
                                        else: []
                                    }
                                },
                                deliveredCount: { $size: "$receiver" }
                            }
                        }, {
                            $addFields: {
                                seenReceiver: {
                                    "$filter": {
                                        "input": "$receiver",
                                        "as": "receiver",
                                        "cond": {
                                            $eq: ["$$receiver.seen", true]
                                        }
                                    }
                                }
                            }
                        }, {
                            $addFields: {
                                deliveredCount: {
                                    $size: "$receiver"
                                },
                                seenCount: {
                                    $size: "$seenReceiver"
                                }
                            }
                        }, { $unset: "seenReceiver" }
                    ])
                    .then((chats) => {
                        if (check.isEmpty(chats)) {
                            logger.info('No Chat Found', 'chatGroupController: findChats()');
                            reject(response.generate(false, 'No Chat Found', 200, null));
                        } else {
                            logger.info('Chat Found', 'chatGroupController: findChats()');
                            resolve(chats)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: findChats()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            })
        }

        //<--Local Functions End

        validateParams()
            .then(findUserAndGetObjectId)
            .then(getGroupJoinedOn)
            .then(findChats)
            .then((chats) => {
                res.send(response.generate(false, 'All Chats Listed', 200, chats));
            })
            .catch((error) => {
                res.send(error);
            });
    },

    markGroupChatSeen: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.chatIds)) {
                    logger.error('Parameters Missing', 'chatGroupController: markGroupChatSeen(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatGroupController: markGroupChatSeen(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let modifyChat = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    chatId: { $in: req.body.chatIds }
                }

                let updateQuery = {
                    $set: {
                        'receiver.$[i].seen': true,
                        'receiver.$[i].modifiedOn': time.now()
                    }
                }

                let options = {
                    multi: true, //to update many
                    arrayFilters: [{
                        "i.receiverId": req.user.userId,
                        "i.receiverName": req.user.userName,
                        "i.delivered": true,
                        "i.seen": false,
                    }]
                }

                ChatModel.update(findQuery, updateQuery, options)
                    .exec()
                    .then((result) => {
                        if (result.n === 0) {
                            logger.info('No Chat Found', 'chatGroupController: markGroupChatSeen(): modifyChat()');
                            reject(response.generate(true, 'No Chat Found', 404, null));
                        } else {
                            if (result.nModified == 0) {
                                logger.info('Chat was not delivered', 'chatGroupController: markGroupChatSeen(): modifyChat()');
                                let updateQuery = {
                                    $addToSet: {
                                        receiver: {
                                            receiverId: req.user.userId,
                                            receiverName: req.user.userName,
                                            delivered: true,
                                            seen: true
                                        }
                                    }
                                }

                                ChatModel.update(findQuery, updateQuery, {
                                        multi: true, //to update many
                                        upsert: true
                                    })
                                    .exec()
                                    .then((result) => {
                                        if (result.n === 0) {
                                            logger.info('No Chat Found', 'chatGroupController: markGroupChatSeen(): modifyChat()');
                                            reject(response.generate(true, 'No Chat Found', 404, null));
                                        } else {
                                            logger.info('Chat Updated', 'chatGroupController: markGroupChatSeen(): modifyChat()');
                                            resolve(result)
                                        }
                                    })
                                    .catch((err) => {
                                        logger.error(err.message, 'chatGroupController: markGroupChatSeen(): modifyChat()', 10);
                                        reject(response.generate(true, `Failed to perform action`, 500, null));
                                    });
                            } else {
                                logger.info('Chat Updated', 'chatGroupController: markGroupChatSeen(): modifyChat()');
                                resolve(result)
                            }
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: markGroupChatSeen(): modifyChat()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        validateParams()
            .then(modifyChat)
            .then((result) => {
                res.send(response.generate(false, 'Chat marked as seen', 200, result));
            })
            .catch((error) => {
                res.send(error);
            })
    },

    markGroupChatDelivered: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.chatIds)) {
                    logger.error('Parameters Missing', 'chatGroupController: markGroupChatDelivered(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatGroupController: markGroupChatDelivered(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let modifyChat = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    chatId: { $in: req.body.chatIds }
                }

                let updateQuery = {
                    $addToSet: {
                        receiver: {
                            receiverId: req.user.userId,
                            receiverName: req.user.userName,
                            delivered: true,
                            seen: false
                        }
                    }
                }

                ChatModel.update(findQuery, updateQuery, {
                        multi: true //to update many
                    })
                    .exec()
                    .then((result) => {
                        if (result.n === 0) {
                            logger.info('No Chat Found', 'chatGroupController: markGroupChatDelivered(): modifyChat()');
                            reject(response.generate(true, 'No Chat Found', 404, null));
                        } else {
                            logger.info('Chat Updated', 'chatGroupController: markGroupChatDelivered(): modifyChat()');
                            resolve(result)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: markGroupChatDelivered(): modifyChat()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        validateParams()
            .then(modifyChat)
            .then((result) => {
                res.send(response.generate(false, 'Chat marked as delivered', 200, result));
            })
            .catch((error) => {
                res.send(error);
            })
    },

    markAllGroupChatDelivered: (req, res) => {

        //Local Function Start-->

        let findGroupUserIn = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    userId: req.user.userId
                }

                UserModel.findOne(findQuery, { _id: 0, groups: 1 })
                    .populate('groups.group_id', 'groupId -_id')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user.groups)) {
                            logger.info('No Group Found', 'chatGroupController: markAllGroupChatDelivered(): findGroupUserIn()');
                            reject(response.generate(true, 'No Group Found', 200, null));
                        } else {
                            logger.info('Groups Found', 'chatGroupController: markAllGroupChatDelivered(): findGroupUserIn()');

                            let groupsArray = Array();
                            for (let i = 0; i < user.groups.length; i++) {
                                groupsArray.push(user.groups[i].group_id.groupId);
                            }

                            resolve(groupsArray)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: markAllGroupChatDelivered(): findGroupUserIn()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            });
        }

        let findUserAndGetObjectId = (groupsArray) => {
            return new Promise((resolve, reject) => {

                UserModel.findOne({ userId: req.user.userId })
                    .select('_id')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.error('No User Found', 'chatGroupController: findUserAndGetObjectId()', 7);
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('User Found', 'chatGroupController: findUserAndGetObjectId()', 10);
                            req.user._id = user._id
                            resolve(groupsArray);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: findUserAndGetObjectId()', 10);
                        reject(response.generate(true, 'Failed to find user', 500, null));
                    });
            });
        }

        let getGroupJoinedOn = (groupsArray) => {
            return new Promise((resolve, reject) => {
                GroupModel.find({
                        groupId: { $in: groupsArray },
                        members: {
                            $elemMatch: {
                                "user_id": req.user._id
                            }
                        }
                    }, { _id: 0, "members.$": 1, groupId: 1 })
                    .then((groups) => {
                        if (check.isEmpty(groups)) {
                            logger.error('No Group Found', 'chatGroupController: getGroupJoinedOn()', 7);
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('Group Found', 'chatGroupController: getGroupJoinedOn()', 10);
                            resolve(groups);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: getGroupJoinedOn()', 10);
                        reject(response.generate(true, 'Failed to find group', 500, null));
                    });
            });
        }

        let findUndeliveredChat = (groups) => {
            return new Promise((resolve, reject) => {

                let allChats = Array();
                for (let i = 0; i < groups.length; i++) {
                    let findQuery = {
                        groupId: groups[i].groupId,
                        createdOn: { $gte: groups[i].members[0].joinedOn },
                        'senderId': {
                            $ne: req.user.userId
                        },
                        'receiver.receiverId': {
                            $ne: req.user.userId
                        }
                    }

                    ChatModel.find(findQuery)
                        .select('-_id chatId groupId senderId')
                        .sort('groupId senderId')
                        .exec()
                        .then((chats) => {
                            if (check.isEmpty(chats)) {
                                logger.info('No Undelivered Chat Found', 'chatGroupController: markAllGroupChatDelivered(): findUndeliveredChat()');
                                if (i == groups.length - 1 && check.isEmpty(allChats))
                                    reject(response.generate(true, 'No Undelivered Group Chat Found', 200, null));
                            } else {
                                logger.info('Undelivered Chat Found', 'chatGroupController: markAllGroupChatDelivered(): findUndeliveredChat()');
                                for (let i = 0; i < chats.length; i++) {
                                    allChats.push({
                                        chatId: chats[i].chatId,
                                        groupId: chats[i].groupId,
                                        senderId: chats[i].senderId
                                    });
                                }
                                if (i == groups.length - 1)
                                    resolve(allChats);
                            }
                        })
                        .catch((err) => {
                            logger.error(err.message, 'chatGroupController: markAllGroupChatDelivered(): findUndeliveredChat()', 10);
                            reject(response.generate(true, `Failed to perform action`, 500, null));
                        });
                }
            });
        }

        let modifyChat = (chats) => {
            return new Promise((resolve, reject) => {
                let chatIds = Array();
                for (let i = 0; i < chats.length; i++) {
                    chatIds.push(chats[i].chatId);
                }
                let findQuery = { chatId: { $in: chatIds } };

                let updateQuery = {
                    $addToSet: {
                        receiver: {
                            receiverId: req.user.userId,
                            receiverName: req.user.userName,
                            delivered: true
                        }
                    }
                }

                ChatModel.update(findQuery, updateQuery, {
                        multi: true //to update many
                    })
                    .exec()
                    .then((result) => {
                        if (result.n === 0) {
                            logger.info('No Undelivered Chat Found', 'chatGroupController: markAllGroupChatDelivered(): modifyChat()');
                            reject(response.generate(true, 'No Undelivered Chat Found', 200, null));
                        } else {
                            logger.info('Undelivered Chat Updated', 'chatGroupController: markAllGroupChatDelivered(): modifyChat()');
                            resolve(chats)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: markAllGroupChatDelivered(): modifyChat()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        findGroupUserIn()
            .then(findUserAndGetObjectId)
            .then(getGroupJoinedOn)
            .then(findUndeliveredChat)
            .then(modifyChat)
            .then((result) => {
                res.send(response.generate(false, 'All Group Chat marked as delivered', 200, result));
            })
            .catch((error) => {
                res.send(error);
            })
    },

    countGroupUnSeenChat: (req, res) => {

        let query = [{
            "$match": {
                'senderId': {
                    $ne: req.user.userId
                },
                "receiver": {
                    $elemMatch: {
                        "receiverId": req.user.userId,
                        "seen": false
                    }
                }
            }
        }, {
            "$group": {
                "_id": {
                    "groupId": "$groupId"
                },
                "count": {
                    $sum: 1
                }
            }
        }, {
            "$project": {
                "groupId": "$_id.groupId",
                "count": "$count",
                "_id": 0
            }
        }];

        ChatModel.aggregate(query)
            .then((result) => {
                logger.info("Unseen Chat Count Found", 'chatGroupController: countGroupUnSeenChat()', 10);
                res.send(response.generate(false, 'unseen chat count found.', 200, result))

            })
            .catch((err) => {
                logger.error(err.message, 'chatGroupController: countGroupUnSeenChat()', 10);
                res.send(response.generate(true, `Failed to perform action`, 500, null));
            });

    },

    getGroupUnSeenChat: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.groupId)) {
                    logger.error('Parameters Missing', 'chatGroupController: getGroupUnSeenChat(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatGroupController: getGroupUnSeenChat(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let findUserAndGetObjectId = () => {
            return new Promise((resolve, reject) => {

                UserModel.findOne({ userId: req.user.userId })
                    .select('_id')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.error('No User Found', 'chatGroupController: findUserAndGetObjectId()', 7);
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('User Found', 'chatGroupController: findUserAndGetObjectId()', 10);
                            req.user._id = user._id
                            resolve();
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: findUserAndGetObjectId()', 10);
                        reject(response.generate(true, 'Failed to find user', 500, null));
                    });
            });
        }

        let getGroupJoinedOn = () => {
            return new Promise((resolve, reject) => {
                GroupModel.findOne({
                        groupId: req.query.groupId,
                        members: {
                            $elemMatch: {
                                "user_id": req.user._id
                            }
                        }
                    }, { _id: 0, "members.$": 1 })
                    .then((group) => {
                        if (check.isEmpty(group)) {
                            logger.error('No Group Found', 'chatGroupController: getGroupJoinedOn()', 7);
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('Group Found', 'chatGroupController: getGroupJoinedOn()', 10);
                            resolve(group.members[0].joinedOn);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: getGroupJoinedOn()', 10);
                        reject(response.generate(true, 'Failed to find group', 500, null));
                    });
            });
        }

        let findChats = (joinedOn) => {
            return new Promise((resolve, reject) => {

                let findQuery = {
                    groupId: req.query.groupId,
                    createdOn: { $gte: joinedOn },
                    senderId: {
                        $ne: req.user.userId
                    },
                    receiver: {
                        $elemMatch: {
                            "receiverId": req.user.userId,
                            "seen": false
                        }
                    }
                };

                ChatModel.find(findQuery)
                    .select('-_id -__v')
                    .sort('-createdOn')
                    .exec()
                    .then((chats) => {
                        if (check.isEmpty(chats)) {
                            logger.info('No Chat Found', 'chatGroupController: getGroupUnSeenChat(): findChats()');
                            reject(response.generate(true, 'No Chat Found', 200, null));
                        } else {
                            logger.info('Chats Found', 'chatGroupController: getGroupUnSeenChat(): findChats()');
                            resolve(chats)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupControllerr: getGroupUnSeenChat(): findChats()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        validateParams()
            .then(findUserAndGetObjectId)
            .then(getGroupJoinedOn)
            .then(findChats)
            .then((chats) => {
                res.send(response.generate(false, 'chat found and listed.', 200, chats))
            })
            .catch((error) => {
                res.send(error)
            });
    },

    getGroupLastChats: (req, res) => {

        let findGroupUserIn = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    userId: req.user.userId
                }

                UserModel.findOne(findQuery, { _id: 0, groups: 1 })
                    .populate('groups.group_id', 'groupId -_id')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user.groups)) {
                            logger.info('No Group Found', 'chatGroupController: markAllGroupChatDelivered(): findGroupUserIn()');
                            reject(response.generate(true, 'No Group Found', 200, null));
                        } else {
                            logger.info('Groups Found', 'chatGroupController: markAllGroupChatDelivered(): findGroupUserIn()');

                            let groupsArray = Array();
                            for (let i = 0; i < user.groups.length; i++) {
                                groupsArray.push(user.groups[i].group_id.groupId);
                            }
                            resolve(groupsArray)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: markAllGroupChatDelivered(): findGroupUserIn()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            });
        }

        let findUserAndGetObjectId = (groupsArray) => {
            return new Promise((resolve, reject) => {

                UserModel.findOne({ userId: req.user.userId })
                    .select('_id')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.error('No User Found', 'chatGroupController: findUserAndGetObjectId()', 7);
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('User Found', 'chatGroupController: findUserAndGetObjectId()', 10);
                            req.user._id = user._id
                            resolve(groupsArray);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: findUserAndGetObjectId()', 10);
                        reject(response.generate(true, 'Failed to find user', 500, null));
                    });
            });
        }

        let getGroupJoinedOn = (groupsArray) => {
            return new Promise((resolve, reject) => {
                GroupModel.find({
                        groupId: { $in: groupsArray },
                        members: {
                            $elemMatch: {
                                "user_id": req.user._id
                            }
                        }
                    }, { _id: 0, "members.$": 1, groupId: 1 })
                    .then((groups) => {
                        if (check.isEmpty(groups)) {
                            logger.error('No Group Found', 'chatGroupController: getGroupJoinedOn()', 7);
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('Group Found', 'chatGroupController: getGroupJoinedOn()', 10);
                            resolve(groups);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupController: getGroupJoinedOn()', 10);
                        reject(response.generate(true, 'Failed to find group', 500, null));
                    });
            });
        }

        let findLastChat = (groups) => {
            return new Promise((resolve, reject) => {

                let allChats = Array();
                for (let i = 0; i < groups.length; i++) {
                    let query = [{
                            "$match": {
                                groupId: groups[i].groupId,
                                createdOn: { $gte: groups[i].members[0].joinedOn },
                            }
                        },
                        { "$sort": { "createdOn": -1 } },
                        {
                            "$group": {
                                "_id": {
                                    "groupId": "$groupId"
                                },
                                "MAX(createdOn)": {
                                    "$max": "$createdOn"
                                },
                                "FIRST(message)": {
                                    "$first": "$message"
                                }
                            }
                        },
                        {
                            "$project": {
                                "groupId": "$_id.groupId",
                                "createdOn": "$MAX(createdOn)",
                                "message": "$FIRST(message)",
                                "_id": 0
                            }
                        },
                        { "$sort": { "createdOn": -1 } }
                    ];

                    ChatModel.aggregate(query)
                        .then((chats) => {
                            if (check.isEmpty(chats)) {
                                logger.info('No Chat Found', 'chatGroupControllerr: findLastChat(): getGroupLastChats()', 10);
                                if (i == groups.length - 1 && check.isEmpty(allChats))
                                    reject(response.generate(true, 'No Unseen Chat Group Found', 200, null));
                            } else {
                                logger.info('Chat Found', 'chatGroupControllerr: findLastChat(): getGroupLastChats()', 10);
                                for (let i = 0; i < chats.length; i++) {
                                    allChats.push({
                                        groupId: chats[i].groupId,
                                        createdOn: chats[i].createdOn,
                                        message: chats[i].message
                                    });
                                }
                                if (i == groups.length - 1)
                                    resolve(allChats);
                            }
                        })
                        .catch((err) => {
                            logger.error(err.message, 'chatGroupControllerr: findLastChat(): getGroupLastChats()', 10);
                            reject(response.generate(true, `Failed to perform action`, 500, null));
                        });
                }
            });
        }

        //<--Local Functions End

        findGroupUserIn()
            .then(findUserAndGetObjectId)
            .then(getGroupJoinedOn)
            .then(findLastChat)
            .then((chats) => {
                res.send(response.generate(false, 'chat found and listed.', 200, chats))
            })
            .catch((error) => {
                res.send(error)
            });
    },

    getChatSeenBy: (req, res) => {
        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.params.chatId)) {
                    logger.error('Parameters Missing', 'chatGroupController: getChatSeenBy(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatGroupController: getChatSeenBy(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let findReceiver = () => {
            return new Promise((resolve, reject) => {

                let findQuery = {
                    chatId: req.params.chatId,
                    senderId: req.user.userId,
                    receiver: {
                        $elemMatch: {
                            delivered: true,
                            seen: true
                        }
                    }
                };

                ChatModel.findOne(findQuery, { _id: 0, receiver: 1 })
                    .sort('-receiver.modifiedOn')
                    .exec()
                    .then((chat) => {
                        if (check.isEmpty(chat)) {
                            logger.info('No Chat Found', 'chatGroupController: getChatSeenBy(): findReceiver()');
                            reject(response.generate(true, 'No Chat Found', 200, null));
                        } else {
                            logger.info('Chat Seen By Found', 'chatGroupController: getChatSeenBy(): findReceiver()');
                            resolve(chat.receiver)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupControllerr: getChatSeenBy(): findReceiver()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        validateParams()
            .then(findReceiver)
            .then((receivers) => {
                res.send(response.generate(false, 'chat seen by found and listed.', 200, receivers))
            })
            .catch((error) => {
                res.send(error)
            });
    },

    getChatDeliveredTo: (req, res) => {
        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.params.chatId)) {
                    logger.error('Parameters Missing', 'chatGroupController: getChatDeliveredTo(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatGroupController: getChatDeliveredTo(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let findReceiver = () => {
            return new Promise((resolve, reject) => {

                let findQuery = {
                    chatId: req.params.chatId,
                    senderId: req.user.userId,
                    receiver: {
                        $elemMatch: {
                            delivered: true
                        }
                    }
                };

                console.log(JSON.stringify(findQuery));


                ChatModel.findOne(findQuery, { _id: 0, receiver: 1 })
                    .sort('-receiver.createdOn')
                    .exec()
                    .then((chat) => {
                        if (check.isEmpty(chat)) {
                            logger.info('No Chat Found', 'chatGroupController: getChatDeliveredTo(): findReceiver()');
                            reject(response.generate(true, 'No Chat Found', 200, null));
                        } else {
                            logger.info('Chat Seen By Found', 'chatGroupController: getChatDeliveredTo(): findReceiver()');
                            resolve(chat.receiver)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatGroupControllerr: getChatDeliveredTo(): findReceiver()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        validateParams()
            .then(findReceiver)
            .then((receivers) => {
                res.send(response.generate(false, 'chat seen by found and listed.', 200, receivers))
            })
            .catch((error) => {
                res.send(error)
            });
    }

}

module.exports = chatGroupController;