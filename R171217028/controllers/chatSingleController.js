const mongoose = require('mongoose');

//Libraries
const response = require('../libs/responseLib');
const logger = require('../libs/loggerLib');
const check = require('../libs/checkLib');

//Models
const ChatModel = mongoose.model('SingleChat');
const UserModel = mongoose.model('User');


let chatController = {

    getUserSeenChat: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.senderId) || check.isEmpty(req.user.userId)) {
                    logger.error('Parameters Missing', 'chatController: getUserSeenChat(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatController: getUserSeenChat(): validateParams()', 9);
                    resolve()
                }
            });
        }


        let findChats = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    $or: [{
                            $and: [
                                { senderId: req.query.senderId },
                                { receiverId: req.user.userId }
                            ],
                            seen: true
                        },
                        {
                            $and: [
                                { receiverId: req.query.senderId },
                                { senderId: req.user.userId }
                            ]
                        }
                    ]
                }

                ChatModel.find(findQuery)
                    .select('-_id -__v -chatRoom')
                    .sort('-createdOn') //Descending order
                    .skip(parseInt(req.query.skip) || 0)
                    .limit(10)
                    .exec()
                    .then((chats) => {
                        if (check.isEmpty(chats)) {
                            logger.info('No Chat Found', 'chatController: findChats()');
                            reject(response.generate(false, 'No Chat Found', 200, null));
                        } else {
                            logger.info('Chat Found', 'chatController: findChats()');
                            resolve(chats)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: findChats()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            })
        }

        //<--Local Functions End

        validateParams()
            .then(findChats)
            .then((chats) => {
                res.send(response.generate(false, 'All Chats Listed', 200, chats));
            })
            .catch((error) => {
                res.send(error);
            });
    },

    markUserChatSeen: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.chatIds)) {
                    logger.error('Parameters Missing', 'chatController: markUserChatSeen(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatController: markUserChatSeen(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let modifyChat = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    chatId: { $in: req.body.chatIds },
                    receiverId: req.user.userId,
                    seen: false
                }

                let updateQuery = {
                    delivered: true,
                    seen: true
                }

                ChatModel.update(findQuery, updateQuery, {
                        multi: true //to update many
                    })
                    .exec()
                    .then((result) => {
                        if (result.n === 0) {
                            logger.info('No Chat Found', 'chatController: markUserChatSeen(): modifyChat()');
                            reject(response.generate(true, 'No Chat Found', 404, null));
                        } else {
                            logger.info('Chat Updated', 'chatController: markUserChatSeen(): modifyChat()');
                            resolve(result)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: markUserChatSeen(): modifyChat()', 10);
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

    markUserChatDelivered: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.chatIds)) {
                    logger.error('Parameters Missing', 'chatController: markUserChatDelivered(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatController: markUserChatDelivered(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let modifyChat = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    chatId: { $in: req.body.chatIds },
                    receiverId: req.user.userId,
                    delivered: false
                }

                let updateQuery = {
                    delivered: true
                }

                ChatModel.update(findQuery, updateQuery, {
                        multi: true //to update many
                    })
                    .exec()
                    .then((result) => {
                        if (result.n === 0) {
                            logger.info('No Chat Found', 'chatController: markUserChatDelivered(): modifyChat()');
                            reject(response.generate(true, 'No Chat Found', 404, null));
                        } else {
                            logger.info('Chat Updated', 'chatController: markUserChatDelivered(): modifyChat()');
                            resolve(result)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: markUserChatDelivered(): modifyChat()', 10);
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

    markAllUserChatDelivered: (req, res) => {

        //Local Function Start-->

        let findBlockedUsers = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    userId: req.user.userId
                }
                let projectQuery = {
                    _id: 0,
                    blocked: 1,
                }
                UserModel.findOne(findQuery, projectQuery)
                    .populate('blocked.user_id', '-_id userId')
                    .then((user) => {
                        logger.info('Blocked Users Found', 'chatController: markAllUserChatDelivered(): findBlockedUsers()', 10);
                        let blockedUsers = Array();
                        for (let i = 0; i < user.blocked.length; i++) {
                            blockedUsers.push(user.blocked[0].user_id.userId);
                        }
                        resolve(blockedUsers);

                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: markAllUserChatDelivered(): findBlockedUsers()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    })
            });
        }

        let findUndeliveredChat = (blockedUsers) => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    receiverId: req.user.userId,
                    senderId: { $nin: blockedUsers },
                    delivered: false
                }

                ChatModel.find(findQuery)
                    .select('chatId senderId')
                    .sort('senderId')
                    .exec()
                    .then((chats) => {
                        if (check.isEmpty(chats)) {
                            logger.info('No Undelivered Chat Found', 'chatController: markAllUserChatDelivered(): findUndeliveredChat()');
                            reject(response.generate(true, 'No Undelivered Chat Found', 200, null));
                        } else {
                            logger.info('Undelivered Chat Found', 'chatController: markAllUserChatDelivered(): findUndeliveredChat()');
                            resolve({ chats: chats, blockedUsers: blockedUsers });
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: markAllUserChatDelivered(): findUndeliveredChat()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            });
        }

        let modifyChat = (data) => {
            return new Promise((resolve, reject) => {
                let chats = data.chats;
                let blockedUsers = data.blockedUsers;
                let findQuery = {
                    receiverId: req.user.userId,
                    senderId: { $nin: blockedUsers },
                    delivered: false
                }

                let updateQuery = {
                    delivered: true
                }

                ChatModel.update(findQuery, updateQuery, {
                        multi: true //to update many
                    })
                    .exec()
                    .then((result) => {
                        if (result.n === 0) {
                            logger.info('No Undelivered Chat Found', 'chatController: markAllUserChatDelivered(): modifyChat()');
                            reject(response.generate(true, 'No Undelivered Chat Found', 200, null));
                        } else {
                            logger.info('Undelivered Single Chat Updated', 'chatController: markAllUserChatDelivered(): modifyChat()');
                            resolve(chats)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: markAllUserChatDelivered(): modifyChat()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        findBlockedUsers()
            .then(findUndeliveredChat())
            .then(modifyChat)
            .then((result) => {
                res.send(response.generate(false, 'All Single Chat marked as delivered', 200, result));
            })
            .catch((error) => {
                res.status(error.status);
                res.send(error);
            })
    },

    countUserUnSeenChat: (req, res) => {

        //Local Function Start-->

        let findBlockedUsers = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    userId: req.user.userId
                }
                let projectQuery = {
                    _id: 0,
                    blocked: 1,
                }
                UserModel.findOne(findQuery, projectQuery)
                    .populate('blocked.user_id', '-_id userId')
                    .then((user) => {
                        logger.info('Blocked Users Found', 'chatController: countUserUnSeenChat(): findBlockedUsers()', 10);
                        let blockedUsers = Array();
                        for (let i = 0; i < user.blocked.length; i++) {
                            blockedUsers.push(user.blocked[0].user_id.userId);
                        }
                        resolve(blockedUsers);

                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: countUserUnSeenChat(): findBlockedUsers()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    })
            });
        }

        let getUnseenCount = (blockedUsers) => {
            return new Promise((resolve, reject) => {
                let query = [{
                        "$match": {
                            "receiverId": req.user.userId,
                            "senderId": { $nin: blockedUsers },
                            "seen": false
                        }
                    },
                    {
                        "$group": {
                            "_id": {
                                "senderId": "$senderId"
                            },
                            "count": {
                                $sum: 1
                            }
                        }
                    },
                    {
                        "$project": {
                            "senderId": "$_id.senderId",
                            "count": "$count",
                            "_id": 0
                        }
                    }
                ];

                ChatModel.aggregate(query)
                    .then((result) => {
                        logger.info("Unseen Chat Count Found", 'chatController: countUserUnSeenChat()', 10);
                        resolve(response.generate(false, 'unseen chat count found.', 200, result))
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: countUserUnSeenChat()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        findBlockedUsers()
            .then(getUnseenCount)
            .then((chatCount) => {
                res.send(chatCount);
            })
            .catch((err) => {
                res.send(err);
            })

    },

    getUserUnSeenChat: (req, res) => {

        //Local Function Start-->

        let validateParams = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.senderId)) {
                    logger.error('Parameters Missing', 'chatController: getUserUnSeenChat(): validateParams()', 9);
                    reject(response.generate(true, 'parameters missing.', 403, null));
                } else {
                    logger.info('Parameters Validated', 'chatController: getUserUnSeenChat(): validateParams()', 9);
                    resolve();
                }
            });
        }

        let checkBlockedUser = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    userId: req.user.userId
                }
                let projectQuery = {
                    _id: 0,
                    blocked: 1,
                }
                UserModel.findOne(findQuery, projectQuery)
                    .populate('blocked.user_id', '-_id userId')
                    .then((user) => {
                        let isBlocked = false;
                        for (let i = 0; i < user.blocked.length; i++) {
                            if (user.blocked[0].user_id.userId == req.query.senderId) {
                                logger.info('User is Blocked', 'chatController: getUserUnSeenChat(): checkBlockedUser()');
                                reject(response.generate(true, 'No Chat Found', 200, null));
                                isBlocked = true;
                                break;
                            }
                        }
                        if (!isBlocked) {
                            logger.info('User is not Blocked', 'chatController: getUserUnSeenChat(): checkBlockedUser()');
                            resolve();
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatController: getUserUnSeenChat(): checkBlockedUser()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    })
            });
        }

        let findChats = () => {
            return new Promise((resolve, reject) => {

                let findQuery = {
                    senderId: req.query.senderId,
                    receiverId: req.user.userId,
                    seen: false
                };

                ChatModel.find(findQuery)
                    .select('-_id -__v')
                    .sort('-createdOn')
                    .exec()
                    .then((chats) => {
                        if (check.isEmpty(chats)) {
                            logger.info('No Chat Found', 'chatController: getUserUnSeenChat(): findChats()');
                            reject(response.generate(true, 'No Chat Found', 200, null));
                        } else {
                            logger.info('Chats Found', 'chatController: getUserUnSeenChat(): findChats()');
                            resolve(chats)
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'chatControllerr: getUserUnSeenChat(): findChats()', 10);
                        reject(response.generate(true, `Failed to perform action`, 500, null));
                    });
            });
        }

        //<--Local Functions End

        validateParams()
            .then(checkBlockedUser)
            .then(findChats)
            .then((chats) => {
                res.send(response.generate(false, 'chat found and listed.', 200, chats))
            })
            .catch((error) => {
                res.send(error)
            });
    },

    getUserLastChats: (req, res) => {

        let query = [{
                "$match": {
                    "$or": [{
                            "senderId": req.user.userId
                        },
                        {
                            "receiverId": req.user.userId
                        }
                    ]
                }
            },
            { "$sort": { "createdOn": -1 } },
            {
                "$group": {
                    "_id": {
                        "senderId": {
                            $cond: { if: { $eq: ["$senderId", req.user.userId] }, then: "$receiverId", else: "$senderId" }
                        }
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
                    "senderId": "$_id.senderId",
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
                    logger.info('No Chat Found', 'chatControllerr: getUserLastChats()', 10);
                    res.send(response.generate(true, 'No Unseen Chat User Found', 200, null));
                } else {
                    logger.info('Chat Found', 'chatControllerr: getUserLastChats()', 10);
                    res.send(response.generate(false, 'chat found and listed.', 200, chats));

                }
            })
            .catch((err) => {
                logger.error(err.message, 'chatControllerr: getUserLastChats()', 10);
                res.send(response.generate(true, `Failed to perform action`, 500, null));
            });
    }

}

module.exports = chatController;