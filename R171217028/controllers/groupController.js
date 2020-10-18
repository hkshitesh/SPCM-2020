const mongoose = require('mongoose');
const shortid = require('shortid');

//Libraries
const time = require('../libs/timeLib');
const response = require('../libs/responseLib');
const logger = require('../libs/loggerLib');
const check = require('../libs/checkLib');

//Models
const GroupModel = mongoose.model('Group');
const UserModel = mongoose.model('User');
const SpamModel = mongoose.model('Spam');


let findUserAndGetObjectId = (userId) => {
    return new Promise((resolve, reject) => {

        UserModel.findOne({ userId: userId })
            .select('_id')
            .exec()
            .then((user) => {
                if (check.isEmpty(user)) {
                    logger.error('No User Found', 'groupController: findUserAndGetObjectId()', 7);
                    reject(response.generate(true, 'No User Found', 404, null));
                } else {
                    logger.info('User Found', 'groupController: findUserAndGetObjectId()', 10);
                    resolve(user._id);
                }
            })
            .catch((err) => {
                logger.error(err.message, 'groupController: findUserAndGetObjectId()', 10);
                reject(response.generate(true, 'Failed to find user', 500, null));
            });
    });
}


let groupController = {

    createGroup: (req, res) => {

        //Local Function Start-->

        let checkUserInput = () => {
            return new Promise((resolve, reject) => {
                if (!req.body.name || !req.body.members) {
                    logger.error('Field Missing During Group Creation', 'groupController: validateUserInput()', 5);
                    reject(response.generate(true, 'One or More Parameter(s) is missing', 400, null));
                } else if (check.isEmpty(req.body.members)) {
                    logger.error('Members Field Is Empty During Group Creation', 'groupController: validateUserInput()', 5);
                    reject(response.generate(true, 'Members field is empty', 400, null));
                } else {
                    logger.info('User Input Validated', 'groupController: validateUserInput()', 5);
                    resolve(req);
                }
            });
        }

        let findUserAndCheckBlockedAndGetObjectId = (userId) => {
            return new Promise((resolve, reject) => {

                UserModel.findOne({ userId: userId }, { userId: 1, _id: 1 })
                    .populate('blocked.user_id', '-_id userId')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.error('No User Found', 'groupController: findUserAndCheckBlockedAndGetObjectId()', 7);
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('User Found', 'groupController: findUserAndCheckBlockedAndGetObjectId()', 10);
                            let isBlocked = false;
                            for (let i = 0; i < user.blocked.length; i++) {
                                if (user.blocked[i].user_id.userId == req.user.userId) {
                                    isBlocked = true;
                                    resolve(null);
                                    break;
                                }
                            }
                            if (!isBlocked)
                                resolve(user._id);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: findUserAndCheckBlockedAndGetObjectId()', 10);
                        reject(response.generate(true, 'Failed to find user', 500, null));
                    });
            });
        }

        let validateMembers = () => {
            return new Promise((resolve, reject) => {

                for (let i = 0; i < req.body.members.length; i++) {
                    let userId = req.body.members[i].userId;
                    findUserAndCheckBlockedAndGetObjectId(userId)
                        .then((user_id) => {
                            if (user_id) {
                                delete req.body.members[i].userId;
                                user_id = mongoose.Types.ObjectId(user_id);
                                req.body.members[i]["user_id"] = user_id;
                            } else {
                                req.body.members.splice(i, 1);
                                i--;
                            }

                            if (i == req.body.members.length - 1) {
                                //for admin
                                let userId = req.user.userId;
                                findUserAndGetObjectId(userId)
                                    .then((user_id) => {
                                        req.user._id = user_id;
                                        let members = req.body.members;
                                        user_id = mongoose.Types.ObjectId(user_id);
                                        members.push({ user_id: user_id, admin: true });
                                        resolve(members);
                                    }).catch((err) => {
                                        reject(err);
                                    });
                            }

                        }).catch((err) => {
                            reject(err);
                        });
                }
            });
        }

        let createGroup = (members) => {
            return new Promise((resolve, reject) => {

                if (members.length == 1) {

                    logger.error('Cannot add blocked user', 'groupController: createGroup', 10);
                    reject(response.generate(true, 'Failed to create group', 403, null));

                } else {
                    let newGroup = {
                        groupId: shortid.generate(),
                        name: req.body.name,
                        members: members
                    };

                    GroupModel.create(newGroup)
                        .then((group) => {
                            group.execPopulate('members.user_id', '-_id userId firstName lastName')
                                .then((group) => {
                                    logger.info('Group Created', 'groupController: createGroup', 10);
                                    group = group.toObject();

                                    for (let i = 0; i < group.members.length; i++) {
                                        delete group.members[i].joinedOn;
                                        delete group.members[i].modifiedOn;
                                    }
                                    delete group.__v;
                                    delete group.modifiedOn;

                                    resolve({ group: group, members: members })
                                })
                                .catch((err) => {
                                    logger.error(err.message, 'groupController: createGroup', 10);
                                    reject(response.generate(true, 'Failed to create group', 403, null));
                                });
                        })
                        .catch((err) => {
                            logger.error(err.message, 'groupController: createGroup', 10);
                            reject(response.generate(true, 'Failed to create group', 403, null));
                        });
                }
            });
        }

        let updateUserDetails = (data) => {
            return new Promise((resolve, reject) => {
                let group = data.group;
                let members = data.members;

                for (let i = 0; i < members.length; i++) {

                    UserModel.update({ _id: members[i].user_id }, {
                            $addToSet: {
                                groups: { group_id: group._id }
                            },
                            modifiedOn: time.now()
                        })
                        .then((result) => {
                            if (result.nModified != 0) {
                                logger.info('User Details Updated', 'groupController: updateUserDetails()', 10);

                                if (i == members.length - 1) {
                                    delete group._id;
                                    resolve(group);
                                }
                            } else {
                                logger.error('User Details Updated', 'groupController: updateUserDetails()', 10);
                                resolve(response.generate(true, 'Group created and user details updated', 403, null));
                            }
                        })
                        .catch((err) => {
                            logger.error(err.message, 'groupController: updateUserDetails()', 10);
                            reject(response.generate(true, 'Failed to update user details', 403, null));
                        });
                }
            });
        }

        //<--Local Functions End

        checkUserInput(req, res)
            .then(validateMembers)
            .then(createGroup)
            .then(updateUserDetails)
            .then((group) => {
                res.send(response.generate(false, 'Group created', 200, group));
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    getAllGroups: (req, res) => {

        //Local Function Start-->

        let getUnspammedGroups = (user_id) => {
            return new Promise((resolve, reject) => {
                GroupModel.aggregate([{
                            $lookup: {
                                from: "spams",
                                localField: "_id",
                                foreignField: "group_id",
                                as: "spam"
                            }
                        },
                        {
                            $match: {
                                "spam.by.user_id": {
                                    $ne: user_id
                                },
                                "members.user_id": {
                                    $eq: user_id
                                }
                            }
                        },
                        {
                            $project: {
                                "groupId": "$groupId",
                                "name": "$name",
                                "_id": 0
                            }
                        }
                    ])
                    .then((groups) => {
                        if (check.isEmpty(groups)) {
                            logger.info('No Group Found', 'groupController: getUnspammedGroups');
                            reject(response.generate(true, 'No Group Found', 404, null));
                        } else {
                            logger.info('Groups Found', 'groupController: getUnspammedGroups');
                            resolve(response.generate(false, 'All Group Details Found', 200, groups));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: getUnspammedGroups', 10);
                        reject(response.generate(true, 'Failed To Find Group Details', 500, null));
                    });
            });
        }

        //<--Local Functions End

        findUserAndGetObjectId(req.user.userId)
            .then(getUnspammedGroups)
            .then((response) => {
                res.status(200);
                res.send(response);
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });
    },

    addUsers: (req, res) => {

        //Local Function Start-->

        let checkUserInput = () => {
            return new Promise((resolve, reject) => {
                if (!req.body.groupId || !req.body.members) {
                    logger.error('Field Missing During Group Creation', 'groupController: validateUserInput()', 5);
                    reject(response.generate(true, 'One or More Parameter(s) is missing', 400, null));
                } else if (check.isEmpty(req.body.members)) {
                    logger.error('Members Field Is Empty During Group Creation', 'groupController: validateUserInput()', 5);
                    reject(response.generate(true, 'Members field is empty', 400, null));
                } else {
                    logger.info('User Input Validated', 'groupController: validateUserInput()', 5);
                    resolve(req);
                }
            });
        }

        let findUserAndCheckBlockedAndGetObjectId = (userId) => {
            return new Promise((resolve, reject) => {

                UserModel.findOne({ userId: userId }, { userId: 1, _id: 1 })
                    .populate('blocked.user_id', '-_id userId')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.error('No User Found', 'groupController: findUserAndCheckBlockedAndGetObjectId()', 7);
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('User Found', 'groupController: findUserAndCheckBlockedAndGetObjectId()', 10);
                            let isBlocked = false;
                            for (let i = 0; i < user.blocked.length; i++) {
                                if (user.blocked[i].user_id.userId == req.user.userId) {
                                    isBlocked = true;
                                    resolve(null);
                                    break;
                                }
                            }
                            if (!isBlocked)
                                resolve(user._id);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: findUserAndCheckBlockedAndGetObjectId()', 10);
                        reject(response.generate(true, 'Failed to find user', 500, null));
                    });
            });
        }

        let validateMembers = () => {
            return new Promise((resolve, reject) => {
                let members = Array();
                let joinedOn = time.now();
                for (let i = 0; i < req.body.members.length; i++) {
                    let userId = req.body.members[i].userId;
                    findUserAndCheckBlockedAndGetObjectId(userId)
                        .then((user_id) => {
                            if (user_id) {
                                user_id = mongoose.Types.ObjectId(user_id);
                                members.push({ user_id: user_id, joinedOn: joinedOn });
                            }

                            if (i == req.body.members.length - 1) {
                                //for admin
                                let userId = req.user.userId;
                                findUserAndGetObjectId(userId)
                                    .then((user_id) => {
                                        req.user._id = user_id;
                                        resolve(members);
                                    }).catch((err) => {
                                        reject(err);
                                    });
                            }
                        }).catch((err) => {
                            reject(err);
                        });
                }
            });
        }

        let addMembers = (members) => {
            return new Promise((resolve, reject) => {

                if (members.length == 0) {

                    logger.error('Cannot add blocked user', 'groupController: addMembers', 10);
                    reject(response.generate(true, 'Failed to add members to group', 403, null));

                } else {

                    let findQuery = {
                        groupId: req.body.groupId,
                        members: {
                            $elemMatch: {
                                user_id: req.user._id,
                                admin: true
                            }
                        }
                    }
                    let updateQuery = {
                        $addToSet: {
                            members: { $each: members }
                        }
                    };

                    GroupModel.update(findQuery, updateQuery)
                        .then((result) => {
                            if (result.nModified != 0) {
                                logger.info('New members added to Group', 'groupController: addMembers()', 10);

                                GroupModel.findOne({ groupId: req.body.groupId }, { "members.joinedOn": 0, "members.modifiedOn": 0 })
                                    .populate('members.user_id', '-_id userId firstName lastName')
                                    .then((group) => {
                                        logger.info('Updated Group Found', 'groupController: addMembers', 10);
                                        group = group.toObject();

                                        delete group.__v;
                                        delete group.modifiedOn;

                                        resolve({ group: group, members: members })
                                    })
                                    .catch((err) => {
                                        logger.error(err.message, 'groupController: addMembers', 10);
                                        reject(response.generate(true, 'Failed to fetch group', 403, null));
                                    });

                            } else {
                                logger.error('Unable to add members to group', 'groupController: addMembers()', 10);
                                resolve(response.generate(true, 'Unable to add members to group', 403, null));
                            }
                        })
                        .catch((err) => {
                            logger.error(err.message, 'groupController: addMembers', 10);
                            reject(response.generate(true, 'Failed to add members to group', 403, null));
                        });
                }
            });
        }

        let updateUserDetails = (data) => {
            return new Promise((resolve, reject) => {
                let group = data.group;
                let members = data.members;

                for (let i = 0; i < members.length; i++) {

                    UserModel.update({ _id: members[i].user_id }, {
                            $addToSet: {
                                groups: { group_id: group._id }
                            },
                            modifiedOn: time.now()
                        })
                        .then((result) => {
                            if (result.nModified != 0) {
                                logger.info('User Details Updated', 'groupController: updateUserDetails()', 10);

                                if (i == members.length - 1) {
                                    delete group._id;
                                    resolve(group);
                                }
                            } else {
                                logger.error('User Details Not Updated', 'groupController: updateUserDetails()', 10);
                                reject(response.generate(true, 'User details not updated', 403, null));
                            }
                        })
                        .catch((err) => {
                            logger.error(err.message, 'groupController: updateUserDetails()', 10);
                            reject(response.generate(true, 'Failed to update user details', 403, null));
                        });
                }
            });
        }

        //<--Local Functions End

        checkUserInput(req, res)
            .then(validateMembers)
            .then(addMembers)
            .then(updateUserDetails)
            .then((group) => {
                res.send(response.generate(false, 'New members added', 200, group));
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    makeUserAdmin: (req, res) => {

        //Local Function Start-->

        let checkUserInput = () => {
            return new Promise((resolve, reject) => {
                if (!req.body.groupId || !req.body.memberId) {
                    logger.error('Field Missing During Group Creation', 'groupController: validateUserInput()', 5);
                    reject(response.generate(true, 'One or More Parameter(s) is missing', 400, null));
                } else {
                    logger.info('User Input Validated', 'groupController: validateUserInput()', 5);
                    resolve(req);
                }
            });
        }

        let validateMembers = () => {
            return new Promise((resolve, reject) => {

                let userId = req.body.memberId;
                findUserAndGetObjectId(userId)
                    .then((user_id) => {
                        user_id = mongoose.Types.ObjectId(user_id);
                        req.body["member_id"] = user_id;
                        //for admin
                        findUserAndGetObjectId(req.user.userId)
                            .then((user_id) => {
                                req.user._id = user_id;
                                resolve();
                            }).catch((err) => {
                                reject(err);
                            });
                    }).catch((err) => {
                        reject(err);
                    });
            });
        }

        let makeAdmin = () => {
            return new Promise((resolve, reject) => {

                let findQuery = {
                    groupId: req.body.groupId,
                    members: {
                        $elemMatch: {
                            user_id: req.user._id,
                            admin: true
                        }
                    }
                }
                let updateQuery = {
                    $set: {
                        "members.$[i].admin": true,
                        "members.$[i].modifiedOn": time.now()
                    }
                };

                let options = {
                    arrayFilters: [{
                        "i.user_id": req.body.member_id
                    }]
                }

                GroupModel.update(findQuery, updateQuery, options)
                    .then((result) => {
                        if (result.nModified != 0) {
                            logger.info('User made admin', 'groupController: makeAdmin()', 10);
                            resolve();
                        } else {
                            logger.error('Unable to make user admin', 'groupController: addMembers()', 10);
                            resolve(response.generate(true, 'Unable to make user admin', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: addMembers', 10);
                        reject(response.generate(true, 'Failed to make user admin', 403, null));
                    });

            });
        }

        //<--Local Functions End

        checkUserInput(req, res)
            .then(validateMembers)
            .then(makeAdmin)
            .then(() => {
                res.send(response.generate(false, 'User made admin', 200, null));
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    removeUserAdmin: (req, res) => {

        //Local Function Start-->

        let checkUserInput = () => {
            return new Promise((resolve, reject) => {
                if (!req.body.groupId || !req.body.memberId) {
                    logger.error('Field Missing During Group Creation', 'groupController: validateUserInput()', 5);
                    reject(response.generate(true, 'One or More Parameter(s) is missing', 400, null));
                } else {
                    logger.info('User Input Validated', 'groupController: validateUserInput()', 5);
                    resolve(req);
                }
            });
        }

        let validateMembers = () => {
            return new Promise((resolve, reject) => {

                let userId = req.body.memberId;
                findUserAndGetObjectId(userId)
                    .then((user_id) => {
                        user_id = mongoose.Types.ObjectId(user_id);
                        req.body["member_id"] = user_id;
                        //for admin
                        findUserAndGetObjectId(req.user.userId)
                            .then((user_id) => {
                                req.user._id = user_id;
                                resolve();
                            }).catch((err) => {
                                reject(err);
                            });
                    }).catch((err) => {
                        reject(err);
                    });
            });
        }

        let checkAdmin = () => {
            return new Promise((resolve, reject) => {

                GroupModel.findOne({
                        groupId: req.body.groupId,
                        members: {
                            $elemMatch: {
                                user_id: req.user._id,
                                admin: true
                            }
                        }
                    }, { "members.$": 1 })
                    .then((admin) => {
                        if (check.isEmpty(admin)) {
                            logger.error('User Not Admin', 'groupController: checkAdmin()', 10);
                            reject(response.generate(true, 'Unable to remove user', 403, null));
                        } else {
                            logger.info('User Checked Admin', 'groupController: checkAdmin()', 10);
                            req.user.modifiedOn = admin.members[0].modifiedOn;
                            resolve();
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: checkAdmin()', 10);
                        reject(response.generate(true, 'Failed to remove user', 500, null));
                    });
            });
        }

        let checkLastAdmin = () => {
            return new Promise((resolve, reject) => {

                if (req.body.memberId == req.user.userId) {
                    logger.info('User is removing himself as admin', 'groupController: checkLastAdmin()', 10);
                    GroupModel.findOne({
                            groupId: req.body.groupId,
                            members: {
                                $elemMatch: {
                                    user_id: req.user._id
                                }
                            }
                        })
                        .then((group) => {

                            if (group.members.length == 1) {
                                logger.error("Can't remove last member ", 'groupController: checkLastAdmin()', 10);
                                reject(response.generate(true, 'Can not be removed as admin as you are last member of group', 403, null));

                            } else {

                                let members = group.members;
                                let minJoinedOn_user_id = undefined;
                                let minJoinedOn = undefined;
                                let isLastAdmin = true;
                                for (let i = 0; i < members.length; i++) {

                                    if (members[i].user_id.toString() == req.user._id.toString())
                                        continue;

                                    if (members[i].admin == true) {
                                        isLastAdmin = false;
                                        break
                                    }
                                    if (minJoinedOn == undefined || new Date(minJoinedOn) > new Date(members[0].joinedOn)) {
                                        minJoinedOn = members[i].joinedOn;
                                        minJoinedOn_user_id = members[i].user_id;
                                    }

                                }
                                if (isLastAdmin) {
                                    logger.info('Is Last Admin of Group', 'groupController: checkLastAdmin()', 10);

                                    let findQuery = {
                                        groupId: req.body.groupId
                                    }

                                    let updateQuery = {
                                        $set: {
                                            "members.$[i].admin": true,
                                            "members.$[i].modifiedOn": time.now()
                                        }
                                    };

                                    let options = {
                                        arrayFilters: [{
                                            "i.user_id": minJoinedOn_user_id
                                        }]
                                    }

                                    GroupModel.update(findQuery, updateQuery, options)
                                        .then((result) => {
                                            if (result.nModified != 0) {
                                                logger.info('New user made admin', 'groupController: checkLastAdmin()', 10);
                                                resolve(false);
                                            } else {
                                                logger.error('Unable to leave group', 'groupController: checkLastAdmin()', 10);
                                                reject(response.generate(true, 'Unable to leave group', 403, null));
                                            }
                                        })
                                        .catch((err) => {
                                            logger.error(err.message, 'groupController: checkLastAdmin', 10);
                                            reject(response.generate(true, 'Failed to leave group', 403, null));
                                        });

                                } else {
                                    logger.info('Not Last Member and last admin of group', 'groupController: checkLastAdmin()', 10);
                                    resolve();
                                }
                            }
                        })
                        .catch((err) => {
                            logger.error(err.message, 'groupController: checkLastAdmin()', 10);
                            reject(response.generate(true, 'Failed to leave group', 500, null));
                        });
                } else {
                    logger.info('User is not removing himself as admin', 'groupController: checkLastAdmin()', 10);
                    resolve();
                }
            });
        }

        let removeAdmin = () => {
            return new Promise((resolve, reject) => {

                let findQuery = {
                    groupId: req.body.groupId,
                    members: {
                        $elemMatch: {
                            user_id: req.body.member_id,
                            modifiedOn: { $gte: req.user.modifiedOn },
                            admin: true
                        }
                    }
                }
                let updateQuery = {
                    $set: {
                        "members.$[i].admin": false,
                        "members.$[i].modifiedOn": time.now()
                    }
                };

                let options = {
                    arrayFilters: [{
                        "i.user_id": req.body.member_id
                    }]
                }

                GroupModel.update(findQuery, updateQuery, options)
                    .then((result) => {
                        if (result.nModified != 0) {
                            logger.info('User removed as admin', 'groupController: removeAdmin()', 10);
                            resolve();
                        } else {
                            logger.error('Unable to remove user as admin', 'groupController: removeAdmin()', 10);
                            reject(response.generate(true, 'Unable to remove user as admin as user became admin before you!', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: removeAdmin()', 10);
                        reject(response.generate(true, 'Failed to remove user as admin', 403, null));
                    });

            });
        }

        //<--Local Functions End

        checkUserInput(req, res)
            .then(validateMembers)
            .then(checkAdmin)
            .then(checkLastAdmin)
            .then(removeAdmin)
            .then(() => {
                res.send(response.generate(false, 'User removed as admin', 200, null));
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    spamGroup: (req, res) => {

        //Local Function Start-->

        let validateField = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.groupId)) {
                    logger.error('Missing Field', 'groupController: validateField()', 5);
                    reject(response.generate(true, 'Parameter is missing', 400, null));
                } else {
                    logger.info('Field Validated', 'groupController: validateField()', 10);
                    resolve();
                }
            });
        }

        let getSpamGroupObjectId = () => {
            return new Promise((resolve, reject) => {

                GroupModel.findOne({ groupId: req.body.groupId })
                    .select('_id')
                    .exec()
                    .then((spamGroup) => {
                        if (check.isEmpty(spamGroup)) {
                            logger.error('No Spam Group Found', 'groupController: findGroupAndGetObjectId()', 7);
                            reject(response.generate(true, 'No Group Details Found', 404, null));
                        } else {
                            logger.info('Spam Group Found', 'groupController: findGroupAndGetObjectId()', 10);
                            req.body["_id"] = spamGroup._id;
                            resolve(req.user.userId);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: findGroupAndGetObjectId()', 10);
                        reject(response.generate(true, 'Failed to find spam group', 500, null));
                    });
            });
        }

        let leaveGroup = (user_id) => {
            return new Promise((resolve, reject) => {
                UserModel.update({
                        userId: req.user.userId,
                    }, {
                        $pull: {
                            groups: { group_id: req.body._id }
                        }
                    }, { upsert: true })
                    .then((result) => {
                        if (result.n == 1) {
                            logger.info('User Left Group', 'groupController: leaveGroup()', 10);
                            resolve(user_id);
                        } else {
                            logger.error('User Unable to Leave Group', 'groupController: leaveGroup()', 10);
                            resolve(response.generate(true, 'User unable to leave group', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: leaveGroup()', 10);
                        reject(response.generate(true, 'Failed to leave group', 500, null));
                    });
            });
        }

        let groupMembersUpdated = (user_id) => {
            return new Promise((resolve, reject) => {
                GroupModel.update({
                        groupId: req.body.groupId,
                    }, {
                        $pull: {
                            members: { user_id: user_id }
                        }
                    }, { upsert: true })
                    .then((result) => {
                        if (result.n == 1) {
                            logger.info('Updated Group Members', 'groupController: groupMembersUpdated()', 10);
                            resolve(user_id);
                        } else {
                            logger.error('Unable to Update Group Members', 'groupController: groupMembersUpdated()', 10);
                            resolve(response.generate(true, 'User unable to leave group', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: groupMembersUpdated()', 10);
                        reject(response.generate(true, 'Failed to leave group', 500, null));
                    });
            });
        }

        let updateGroupInSpam = (user_id) => {
            return new Promise((resolve, reject) => {

                SpamModel.update({
                        group_id: req.body._id
                    }, {
                        $addToSet: {
                            by: { user_id: user_id }
                        },
                        modifiedOn: time.now()
                    }, { upsert: true }) //Insert if document not present
                    .then((result) => {

                        if (!check.isEmpty(result.upserted) || result.nModified != 0) {
                            logger.info('Group Spammed', 'groupController: updateGroupInSpam()', 10);
                            resolve(response.generate(false, 'Group spammed', 200, null));
                        } else {
                            logger.error('Group Unable to Spam', 'groupController: updateGroupInSpam()', 10);
                            resolve(response.generate(true, 'Group unable to spam', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: updateGroupInSpam()', 10);
                        reject(response.generate(true, 'Failed to spam group', 500, null));
                    });

            });
        }

        //<--Local Functions End

        validateField(req, res)
            .then(getSpamGroupObjectId)
            .then(findUserAndGetObjectId)
            .then(leaveGroup)
            .then(groupMembersUpdated)
            .then(updateGroupInSpam)
            .then((response) => {
                res.status(200);
                res.send(response);
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    leaveGroup: (req, res) => {

        //Local Function Start-->

        let validateField = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.groupId)) {
                    logger.error('Missing Field', 'groupController: validateField()', 5);
                    reject(response.generate(true, 'Parameter is missing', 400, null));
                } else {
                    logger.info('Field Validated', 'groupController: validateField()', 10);
                    resolve();
                }
            });
        }

        let getGroupObjectId = () => {
            return new Promise((resolve, reject) => {

                GroupModel.findOne({ groupId: req.body.groupId })
                    .select('_id')
                    .exec()
                    .then((group) => {
                        if (check.isEmpty(group)) {
                            logger.error('No Group Found', 'groupController: getGroupObjectId()', 7);
                            reject(response.generate(true, 'No Group Details Found', 404, null));
                        } else {
                            logger.info('Group Found', 'groupController: getGroupObjectId()', 10);
                            req.body["group_id"] = group._id;
                            resolve(req.user.userId);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: getGroupObjectId()', 10);
                        reject(response.generate(true, 'Failed to find spam group', 500, null));
                    });
            });
        }

        let leaveGroup = (user_id) => {
            return new Promise((resolve, reject) => {
                req.user['_id'] = user_id;
                UserModel.update({
                        userId: req.user.userId,
                    }, {
                        $pull: {
                            groups: { group_id: req.body.group_id }
                        }
                    })
                    .then((result) => {
                        if (result.nModified == 1) {
                            logger.info('User Left Group', 'groupController: leaveGroup()', 10);
                            resolve();
                        } else {
                            logger.error('User Unable to Leave Group', 'groupController: leaveGroup()', 10);
                            resolve(response.generate(true, 'User unable to leave group', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: leaveGroup()', 10);
                        reject(response.generate(true, 'Failed to leave group', 500, null));
                    });
            });
        }

        let checkLastMember = () => {
            return new Promise((resolve, reject) => {

                GroupModel.findOne({
                        groupId: req.body.groupId,
                        members: {
                            $elemMatch: {
                                user_id: req.user._id
                            }
                        }
                    })
                    .then((group) => {

                        if (group.members.length == 1) {
                            logger.info('Last Member of group', 'groupController: checkLastMember()', 10);
                            GroupModel.deleteOne({ groupId: req.body.groupId })
                                .then((result) => {
                                    if (result.deletedCount == 1) {
                                        logger.info('Group Deleted', 'groupController: checkLastMember()', 10);
                                        resolve(true);
                                    } else {
                                        logger.error(err.message, 'groupController: checkLastMember()', 10);
                                        reject(response.generate(true, 'Unable to leave group', 500, null));
                                    }
                                }).catch((err) => {
                                    logger.error(err.message, 'groupController: checkLastMember()', 10);
                                    reject(response.generate(true, 'Failed to leave group', 500, null));
                                });

                        } else {

                            let members = group.members;
                            let minJoinedOn_user_id = members[0].user_id;
                            let minJoinedOn = members[0].joinedOn;
                            let isLastAdmin = true;
                            for (let i = 0; i < members.length; i++) {
                                if (members[i].admin == true) {
                                    isLastAdmin = false;
                                    break;
                                }
                                if (new Date(minJoinedOn) > new Date(members[0].joinedOn)) {
                                    minJoinedOn = members[i].joinedOn;
                                    minJoinedOn_user_id = members[i].user_id;
                                }
                            }
                            if (isLastAdmin) {
                                logger.info('Is Last Admin of Group', 'groupController: checkLastMember()', 10);

                                let findQuery = {
                                    groupId: req.body.groupId
                                }

                                let updateQuery = {
                                    $set: {
                                        "members.$[i].admin": true,
                                        "members.$[i].modifiedOn": time.now()
                                    }
                                };

                                let options = {
                                    arrayFilters: [{
                                        "i.user_id": minJoinedOn_user_id
                                    }]
                                }

                                GroupModel.update(findQuery, updateQuery, options)
                                    .then((result) => {
                                        if (result.nModified != 0) {
                                            logger.info('New user made admin', 'groupController: checkLastMember()', 10);
                                            resolve(false);
                                        } else {
                                            logger.error('Unable to leave group', 'groupController: checkLastMember()', 10);
                                            resolve(response.generate(true, 'Unable to leave group', 403, null));
                                        }
                                    })
                                    .catch((err) => {
                                        logger.error(err.message, 'groupController: checkLastMember', 10);
                                        reject(response.generate(true, 'Failed to leave group', 403, null));
                                    });

                            } else {
                                logger.info('Not Last Member and last admin of group', 'groupController: checkLastMember()', 10);
                                resolve(false);
                            }
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: checkLastMember()', 10);
                        reject(response.generate(true, 'Failed to leave group', 500, null));
                    });
            });
        }

        let groupMembersUpdated = (isLastMember) => {
            return new Promise((resolve, reject) => {
                if (isLastMember)
                    resolve();
                else {
                    GroupModel.update({
                            groupId: req.body.groupId,
                        }, {
                            $pull: {
                                members: { user_id: req.user._id }
                            }
                        })
                        .then((result) => {
                            if (result.nModified != 0) {
                                logger.info('Updated Group Members', 'groupController: groupMembersUpdated()', 10);
                                resolve();
                            } else {
                                logger.error('Unable to Update Group Members', 'groupController: groupMembersUpdated()', 10);
                                resolve(response.generate(true, 'User unable to leave group', 403, null));
                            }
                        })
                        .catch((err) => {
                            logger.error(err.message, 'groupController: groupMembersUpdated()', 10);
                            reject(response.generate(true, 'Failed to leave group', 500, null));
                        });
                }
            });
        }

        //<--Local Functions End

        validateField(req, res)
            .then(getGroupObjectId)
            .then(findUserAndGetObjectId)
            .then(leaveGroup)
            .then(checkLastMember)
            .then(groupMembersUpdated)
            .then(() => {
                res.status(200);
                res.send(response.generate(false, 'Left group sucessfully', 200, null));
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    removeUser: (req, res) => {

        //Local Function Start-->

        let validateField = () => {
            return new Promise((resolve, reject) => {
                if (!req.body.groupId || !req.body.memberId) {
                    logger.error('Missing Field', 'groupController: validateField()', 5);
                    reject(response.generate(true, 'Parameter is missing', 400, null));
                } else {
                    logger.info('Field Validated', 'groupController: validateField()', 10);
                    resolve();
                }
            });
        }

        let getGroupObjectId = () => {
            return new Promise((resolve, reject) => {

                GroupModel.findOne({ groupId: req.body.groupId })
                    .select('_id')
                    .exec()
                    .then((group) => {
                        if (check.isEmpty(group)) {
                            logger.error('No Group Found', 'groupController: getGroupObjectId()', 7);
                            reject(response.generate(true, 'No Group Found', 404, null));
                        } else {
                            logger.info('Group Found', 'groupController: getGroupObjectId()', 10);
                            req.body["group_id"] = group._id;
                            resolve(req.user.userId);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: getGroupObjectId()', 10);
                        reject(response.generate(true, 'Failed to remove user', 500, null));
                    });
            });
        }

        let checkAdminAndGetId = (user_id) => {
            return new Promise((resolve, reject) => {

                GroupModel.findOne({
                        groupId: req.body.groupId,
                        members: {
                            $elemMatch: {
                                user_id: user_id,
                                admin: true
                            }
                        }
                    }, { "members.$": 1 })
                    .then((admin) => {
                        if (check.isEmpty(admin)) {
                            logger.error('User Not Admin', 'groupController: checkAdminAndGetId()', 10);
                            resolve(response.generate(true, 'Unable to remove user', 403, null));
                        } else {
                            logger.info('User Checked Admin', 'groupController: checkAdminAndGetId()', 10);
                            findUserAndGetObjectId(req.body.memberId)
                                .then((user_id) => {
                                    logger.info('Member _id Found', 'groupController: checkAdminAndGetId()', 10);
                                    req.body["member_id"] = user_id;
                                    req.user.modifiedOn = admin.members[0].modifiedOn;
                                    resolve();
                                })
                                .catch((err) => {
                                    logger.error(err.message, 'groupController: checkAdminAndGetId()', 10);
                                    reject(response.generate(true, 'Failed to remove user', 500, null));
                                });
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: checkAdminAndGetId()', 10);
                        reject(response.generate(true, 'Failed to remove user', 500, null));
                    });
            });
        }

        let groupMembersUpdated = () => {
            return new Promise((resolve, reject) => {
                let findQuery = {
                    groupId: req.body.groupId,
                    members: {
                        $elemMatch: {
                            user_id: req.body.member_id,
                            $or: [{
                                $and: [
                                    { admin: true },
                                    { modifiedOn: { $gte: req.user.modifiedOn } }
                                ]
                            }, {
                                admin: false
                            }]
                        }
                    }
                };

                let updateQuery = {
                    $pull: {
                        members: { user_id: req.body.member_id }
                    }
                };

                GroupModel.update(findQuery, updateQuery)
                    .then((result) => {
                        if (result.nModified != 0) {
                            logger.info('Updated Group Members', 'groupController: groupMembersUpdated()', 10);
                            resolve();
                        } else {
                            logger.error('Member became admin before User', 'groupController: groupMembersUpdated()', 10);
                            reject(response.generate(true, 'Unable to remove, user became admin before you!', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: groupMembersUpdated()', 10);
                        reject(response.generate(true, 'Failed to leave group', 500, null));
                    });
            });
        }

        let leaveGroup = () => {
            return new Promise((resolve, reject) => {
                UserModel.update({
                        userId: req.body.memberId,
                    }, {
                        $pull: {
                            groups: { group_id: req.body.group_id }
                        }
                    })
                    .then((result) => {
                        if (result.nModified != 0) {
                            logger.info('User Left Group', 'groupController: leaveGroup()', 10);
                            resolve(response.generate(false, 'User removed from group', 200, null));
                        } else {
                            logger.error('Unable to Remove User From Group', 'groupController: leaveGroup()', 10);
                            resolve(response.generate(true, 'Unable to remove user', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: leaveGroup()', 10);
                        reject(response.generate(true, 'Failed to remove user', 500, null));
                    });
            });
        }

        //<--Local Functions End

        validateField(req, res)
            .then(getGroupObjectId)
            .then(findUserAndGetObjectId)
            .then(checkAdminAndGetId)
            .then(groupMembersUpdated)
            .then(leaveGroup)
            .then((response) => {
                res.status(200);
                res.send(response);
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    getGroup: (req, res) => {

        let validateField = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.groupId)) {
                    logger.error('Missing Field', 'groupController: validateField()', 5);
                    reject(response.generate(true, 'Parameter is missing', 400, null));
                } else {
                    logger.info('Field Validated', 'groupController: validateField()', 10);
                    resolve(req.user.userId);
                }
            });
        }

        let getGroupInfo = (user_id) => {
            return new Promise((resolve, reject) => {

                let findQuery = {
                    groupId: req.query.groupId,
                    members: {
                        $elemMatch: {
                            user_id: user_id
                        }
                    }
                };

                GroupModel.findOne(findQuery, { _id: 0, __v: 0, modifiedOn: 0 })
                    .populate('members.user_id', '-_id userId firstName lastName')
                    .exec()
                    .then((group) => {
                        logger.info('Group Found', 'groupController: getGroupInfo', 10);
                        resolve(group)
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: getGroupInfo', 10);
                        reject(response.generate(true, 'Failed to get group details', 403, null));
                    });
            });
        }

        validateField(req, res)
            .then(findUserAndGetObjectId)
            .then(getGroupInfo)
            .then((group) => {
                res.status(200);
                res.send(response.generate(false, 'Group fetched', 200, group));
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });
    },

    getGroupNonMembers: (req, res) => {

        let validateField = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.query.groupId)) {
                    logger.error('Missing Field', 'groupController: validateField()', 5);
                    reject(response.generate(true, 'Parameter is missing', 400, null));
                } else {
                    logger.info('Field Validated', 'groupController: validateField()', 10);
                    resolve(req.user.userId);
                }
            });
        }

        let getGroupMembers = (user_id) => {
            return new Promise((resolve, reject) => {

                let findQuery = {
                    groupId: req.query.groupId,
                    members: {
                        $elemMatch: {
                            user_id: user_id,
                            admin: true
                        }
                    }
                };

                GroupModel.findOne(findQuery, { _id: 0, __v: 0, modifiedOn: 0 })
                    .then((group) => {
                        logger.info('Group Members Fetched', 'groupController: getGroupMembers', 10);
                        let members_id = Array();
                        for (let i = 0; i < group.members.length; i++) {
                            members_id.push(group.members[i].user_id);
                        }
                        resolve({ members_id: members_id, user_id: user_id });
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: getGroupMembers', 10);
                        reject(response.generate(true, 'Failed to get group details', 403, null));
                    });
            });
        }

        let getGroupNonMembers = (data) => {
            return new Promise((resolve, reject) => {

                let findQuery = {
                    _id: {
                        $nin: data.members_id
                    }
                };

                UserModel.find(findQuery, { _id: 1, userId: 1, firstName: 1, lastName: 1 })
                    .then((nonmembers) => {
                        logger.info('Group Non-Members Found', 'groupController: getGroupMembers', 10);
                        delete data['members_id'];
                        data['nonmembers'] = nonmembers;
                        resolve(data);
                    })
                    .catch((err) => {
                        logger.error(err.message, 'groupController: getGroupNonMembers', 10);
                        reject(response.generate(true, 'Failed to get group details', 403, null));
                    });
            });
        }

        let getNonMembersWithBlocklist = (data) => {
            return new Promise((resolve, reject) => {

                let nonmembers = data.nonmembers;

                if (check.isEmpty(nonmembers)) {
                    resolve(nonmembers);
                } else {

                    let nonmembers_id = Array();
                    for (let i = 0; i < nonmembers.length; i++) {
                        nonmembers_id.push(nonmembers[i]._id);
                    }

                    let user_id = data.user_id;
                    let findQuery = {
                        _id: user_id,
                        blocked: {
                            $elemMatch: {
                                user_id: { $in: nonmembers_id }
                            }
                        }
                    };
                    UserModel.findOne(findQuery, { _id: 0, blocked: 1 })
                        .then((user) => {
                            if (check.isEmpty(user)) {
                                logger.info('No Blocked Group Non-Members Found', 'groupController: getGroupMembers', 10);
                                for (let i = 0; i < nonmembers.length; i++) {
                                    nonmembers[i]['_id'] = null;
                                    nonmembers[i]['blocked'] = false;
                                }
                            } else {
                                let blockednonmembers = user.blocked;
                                logger.info('Blocked Group Non-Members Found', 'groupController: getGroupMembers', 10);
                                for (let i = 0; i < nonmembers_id.length; i++) {
                                    let blocked = false;
                                    for (let j = 0; j < blockednonmembers.length; j++) {
                                        if (blockednonmembers[j].user_id.toString() == nonmembers_id[i].toString()) {
                                            blocked = true;
                                            break;
                                        }
                                    }
                                    nonmembers[i]['_id'] = null;
                                    nonmembers[i]['blocked'] = blocked;
                                }
                            }
                            resolve(nonmembers);
                        })
                        .catch((err) => {
                            logger.error(err.message, 'groupController: getGroupMembers', 10);
                            reject(response.generate(true, 'Failed to get group details', 403, null));
                        });
                }
            });
        }

        validateField(req, res)
            .then(findUserAndGetObjectId)
            .then(getGroupMembers)
            .then(getGroupNonMembers)
            .then(getNonMembersWithBlocklist)
            .then((nonmembers) => {
                res.status(200);
                res.send(response.generate(false, 'Group non-members fetched', 200, nonmembers));
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });
    }
}

module.exports = groupController;