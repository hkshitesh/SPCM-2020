const mongoose = require('mongoose');
const shortid = require('shortid');

//Libraries
const time = require('../libs/timeLib');
const password = require('../libs/passwordLib');
const response = require('../libs/responseLib');
const logger = require('../libs/loggerLib');
const validate = require('../libs/validationLib');
const check = require('../libs/checkLib');
const token = require('../libs/tokenLib');

//Models
const UserModel = mongoose.model('User');
const AuthModel = mongoose.model('Auth');
const SpamModel = mongoose.model('Spam');


let userController = {

    signUp: (req, res) => {

        //Local Function Start-->

        let validateUserInput = () => {
            return new Promise((resolve, reject) => {
                if (!req.body.email || !req.body.password) {
                    logger.error('Field Missing During User Creation', 'userController: validateUserInput()', 5);
                    reject(response.generate(true, 'One or More Parameter(s) is missing', 400, null));
                } else if (!validate.email(req.body.email)) {
                    logger.error('Email Field Not Valid During User Creation', 'userController: validateUserInput()', 5);
                    reject(response.generate(true, 'Email does not met the requirement', 400, null));
                } else if (!validate.password(req.body.password)) {
                    logger.error('Password Field Not Valid During User Creation', 'userController: validateUserInput()', 5);
                    reject(response.generate(true, 'Password does not met the requirement', 400, null));
                } else {
                    logger.info('User Input Validated', 'userController: validateUserInput()', 5);
                    resolve(req);
                }
            });
        }

        let createUser = () => {
            return new Promise((resolve, reject) => {

                let newUser = {
                    userId: shortid.generate(),
                    firstName: req.body.firstName,
                    lastName: req.body.lastName || '',
                    email: req.body.email.toLowerCase(),
                    mobileNumber: req.body.mobileNumber,
                    password: password.hashpassword(req.body.password),
                    createdOn: time.now()
                };

                UserModel.create(newUser)
                    .then((user) => {
                        logger.info('User Created', 'userController: createUser', 10);
                        resolve(user.toObject());
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: createUser', 10);
                        reject(response.generate(true, 'Failed to create user', 403, null));
                    });

            });
        }

        //<--Local Functions End

        validateUserInput(req, res)
            .then(createUser)
            .then((user) => {
                delete user.password;
                res.send(response.generate(false, 'User created', 200, user));
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    login: (req, res) => {

        //Local Function Start-->

        let findUser = () => {
            return new Promise((resolve, reject) => {

                UserModel.findOne({ email: req.body.email })
                    .populate('blocked.user_id', 'userId -_id')
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.error('No User Found', 'userController: findUser()', 7);
                            reject(response.generate(true, 'No User Details Found', 404, null));
                        } else {
                            logger.info('User Found', 'userController: findUser()', 10);
                            resolve(user);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: findUser()', 10);
                        reject(response.generate(true, 'Failed to find user', 500, null));
                    });
            });
        }

        let validatePassword = (user) => {
            return new Promise((resolve, reject) => {
                password.comparePassword(req.body.password, user.password)
                    .then((isMatch) => {
                        if (isMatch) {
                            logger.info('Password validated', 'userController: validatePassword()', 10);
                            let userObj = user.toObject();
                            delete userObj.password;
                            delete userObj._id;
                            delete userObj.__v;
                            delete userObj.createdOn;
                            delete userObj.modifiedOn;
                            resolve(userObj);
                        } else {
                            logger.error('Login Failed Due To Invalid Password', 'userController: validatePassword()', 10);
                            reject(response.generate(true, 'Wrong Password.Login Failed', 400, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: validatePassword()', 10);
                        reject(response.generate(true, 'Login Failed', 500, null));
                    });
            });
        }

        let generateToken = (user) => {
            return new Promise((resolve, reject) => {
                token.generateToken(user)
                    .then((tokenDetails) => {
                        logger.info('Token Generated', 'userController: generateToken()', 10);
                        tokenDetails.userId = user.userId;
                        tokenDetails.user = user;
                        resolve(tokenDetails);
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: generateToken()', 10);
                        reject(response.generate(true, 'Failed To Generate Token', 500, null));
                    });
            });
        }

        let saveToken = (tokenDetails) => {
            let newAuthToken = new AuthModel({
                userId: tokenDetails.userId,
                authToken: tokenDetails.token,
                tokenSecret: tokenDetails.tokenSecret,
                tokenGenerationTime: time.now()
            });
            return new Promise((resolve, reject) => {
                AuthModel.create(newAuthToken)
                    .then((token) => {
                        logger.info('Token Saved', 'userController: saveToken()', 10);
                        let responseBody = {
                            authToken: token.authToken,
                            userId: token.userId
                        }
                        resolve(responseBody);
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: saveToken()', 10);
                        req.user = { userId: tokenDetails.userId };
                        userController.logout(req, res);
                        reject(response.generate(true, 'Failed you may be login somewhere else, Try Again!', 500, null));
                    });
            });
        }

        //<--Local Functions End

        findUser(req, res)
            .then(validatePassword)
            .then(generateToken)
            .then(saveToken)
            .then((resolve) => {
                res.status(200);
                res.send(response.generate(false, 'Login Successful', 200, resolve));
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });
    },

    blockUser: (req, res) => {
        //Local Function Start-->

        let validateField = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.userId)) {
                    logger.error('Missing Field', 'userController: validateField()', 5);
                    reject(response.generate(true, 'Parameter is missing', 400, null));
                } else {
                    logger.info('Field Validated', 'userController: validateField()', 10);
                    resolve(req.body.userId);
                }
            });
        }

        let findUserAndGetObjectId = (userId) => {
            return new Promise((resolve, reject) => {

                UserModel.findOne({ userId: userId })
                    .select('_id')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.error('No User Found', 'userController: findUserAndGetObjectId()', 7);
                            reject(response.generate(true, 'No User Details Found', 404, null));
                        } else {
                            logger.info('User Found', 'userController: findUserAndGetObjectId()', 10);
                            resolve(user);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: findUserAndGetObjectId()', 10);
                        reject(response.generate(true, 'Failed to find user', 500, null));
                    });
            });
        }

        let addUserToBlocked = (user) => {
            return new Promise((resolve, reject) => {

                UserModel.update({
                        userId: req.user.userId,
                    }, {
                        $addToSet: {
                            blocked: { user_id: user._id }
                        }
                    }, { upsert: true })
                    .then((result) => {
                        if (result.n == 1) {
                            logger.info('User Blocked', 'userController: addUserToBlocked()', 10);
                            resolve(response.generate(false, 'User Blocked', 200, null));
                        } else {
                            logger.error('User Unable to Block', 'userController: addUserToBlocked()', 10);
                            resolve(response.generate(true, 'User unable to block', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: addUserToBlocked()', 10);
                        reject(response.generate(true, 'Failed to block user', 500, null));
                    });

            });
        }

        //<--Local Functions End

        validateField(req, res)
            .then(findUserAndGetObjectId)
            .then(addUserToBlocked)
            .then((response) => {
                res.status(200);
                res.send(response);
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    unblockUser: (req, res) => {
        //Local Function Start-->

        let validateField = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.userId)) {
                    logger.error('Missing Field', 'userController: validateField()', 5);
                    reject(response.generate(true, 'Parameter is missing', 400, null));
                } else {
                    logger.info('Field Validated', 'userController: validateField()', 10);
                    resolve(req.body.userId);
                }
            });
        }

        let findUserAndGetObjectId = (userId) => {
            return new Promise((resolve, reject) => {

                UserModel.findOne({ userId: userId })
                    .select('_id')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.error('No User Found', 'userController: findUserAndGetObjectId()', 7);
                            reject(response.generate(true, 'No User Details Found', 404, null));
                        } else {
                            logger.info('User Found', 'userController: findUserAndGetObjectId()', 10);
                            resolve(user);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: findUserAndGetObjectId()', 10);
                        reject(response.generate(true, 'Failed to find user', 500, null));
                    });
            });
        }

        let removeUserFromBlocked = (user) => {
            return new Promise((resolve, reject) => {

                UserModel.update({
                        userId: req.user.userId,
                    }, {
                        $pull: {
                            blocked: { user_id: user._id }
                        }
                    }, { upsert: true })
                    .then((result) => {
                        if (result.n == 1) {
                            logger.info('User Unblocked', 'userController: removeUserFromBlocked()', 10);
                            resolve(response.generate(false, 'User Unblocked', 200, null));
                        } else {
                            logger.error('User Unable to Unblock', 'userController: removeUserFromBlocked()', 10);
                            resolve(response.generate(true, 'User unable to unblock', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: removeUserFromBlocked()', 10);
                        reject(response.generate(true, 'Failed to unblock user', 500, null));
                    });

            });
        }

        //<--Local Functions End

        validateField(req, res)
            .then(findUserAndGetObjectId)
            .then(removeUserFromBlocked)
            .then((response) => {
                res.status(200);
                res.send(response);
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    spamUser: (req, res) => {

        //Local Function Start-->

        let validateField = () => {
            return new Promise((resolve, reject) => {
                if (check.isEmpty(req.body.userId)) {
                    logger.error('Missing Field', 'userController: validateField()', 5);
                    reject(response.generate(true, 'Parameter is missing', 400, null));
                } else {
                    logger.info('Field Validated', 'userController: validateField()', 10);
                    resolve();
                }
            });
        }

        let getSpamUserObjectId = () => {
            return new Promise((resolve, reject) => {

                UserModel.findOne({ userId: req.body.userId })
                    .select('_id')
                    .exec()
                    .then((spamUser) => {
                        if (check.isEmpty(spamUser)) {
                            logger.error('No Spam User Found', 'userController: findUserAndGetObjectId()', 7);
                            reject(response.generate(true, 'No User Details Found', 404, null));
                        } else {
                            logger.info('Spam User Found', 'userController: findUserAndGetObjectId()', 10);
                            req.body["_id"] = spamUser._id;
                            resolve();
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: findUserAndGetObjectId()', 10);
                        reject(response.generate(true, 'Failed to find spam user', 500, null));
                    });
            });
        }

        let addUserToBlocked = () => {
            return new Promise((resolve, reject) => {

                UserModel.update({
                        userId: req.user.userId
                    }, {
                        $addToSet: {
                            blocked: { user_id: req.body._id }
                        }
                    }, { upsert: true })
                    .then((result) => {
                        if (result.n == 1) {
                            logger.info('Spam User Blocked', 'userController: addUserToBlocked()', 10);
                            resolve(response.generate(false, 'User Blocked', 200, null));
                        } else {
                            logger.error('Spam User Unable to Block', 'userController: addUserToBlocked()', 10);
                            resolve();
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: addUserToBlocked()', 10);
                        reject(response.generate(true, 'Failed to block user', 500, null));
                    });

            });
        }

        let getUserObjectId = () => {
            return new Promise((resolve, reject) => {
                UserModel.findOne({ userId: req.user.userId })
                    .select('_id')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.error('No User Found', 'userController: getUserObjectId()', 7);
                            reject(response.generate(true, 'No User Details Found', 404, null));
                        } else {
                            logger.info('User Found', 'userController: getUserObjectId()', 10);
                            req.user["_id"] = user._id;

                            resolve();
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: getUserObjectId()', 10);
                        reject(response.generate(true, 'Failed to find user', 500, null));
                    });
            });
        }

        let updateUserInSpam = () => {
            return new Promise((resolve, reject) => {

                SpamModel.update({
                        user_id: req.body._id
                    }, {
                        $addToSet: {
                            by: { user_id: req.user._id }
                        },
                        modifiedOn: time.now()
                    }, { upsert: true }) //Insert if document not present
                    .then((result) => {
                        console.log(result);

                        if (!check.isEmpty(result.upserted) || result.nModified != 0) {
                            logger.info('User Spammed', 'userController: updateUserInSpam()', 10);
                            resolve(response.generate(false, 'User spammed', 200, null));
                        } else {
                            logger.error('User Unable to Spam', 'userController: updateUserInSpam()', 10);
                            resolve(response.generate(true, 'User unable to spam', 403, null));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: updateUserInSpam()', 10);
                        reject(response.generate(true, 'Failed to spam user', 500, null));
                    });

            });
        }

        //<--Local Functions End

        validateField(req, res)
            .then(getSpamUserObjectId)
            .then(addUserToBlocked)
            .then(getUserObjectId)
            .then(updateUserInSpam)
            .then((response) => {
                res.status(200);
                res.send(response);
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });

    },

    logout: (req, res) => {

        AuthModel.findOneAndDelete({ userId: req.user.userId })
            .then((result) => {
                if (check.isEmpty(result)) {
                    logger.info('User already Loggedout', 'userController: saveToken()', 10);
                    res.send(response.generate(true, 'Already Logged Out or Invalid UserId', 404, null))
                } else {
                    logger.info('User Loggedout', 'userController: saveToken()', 10);
                    res.send(response.generate(false, 'Logged Out Successfully', 200, null));
                }
            })
            .catch((err) => {
                logger.error(err.message, 'user Controller: logout', 10);
                res.status(err.status);
                res.send(response.generate(true, `error occurred: ${err.message}`, 500, null));
            });
    },

    getUsers: (req, res) => {

        let getUserObjectId = () => {
            return new Promise((resolve, reject) => {
                UserModel.findOne({ userId: req.user.userId }, { blocked: 1, _id: 1 })
                    .populate('blocked.user_id', '-_id userId')
                    .exec()
                    .then((user) => {
                        if (check.isEmpty(user)) {
                            logger.error('No User Found', 'userController: getUserObjectId()', 7);
                            reject(response.generate(true, 'No User Details Found', 404, null));
                        } else {
                            logger.info('User Found', 'userController: getUserObjectId()', 10);
                            req.user["_id"] = user._id;
                            let blockedUsers = Array();
                            for (let i = 0; i < user.blocked.length; i++) {
                                blockedUsers.push(user.blocked[i].user_id.userId);
                            }
                            resolve(blockedUsers);
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'userController: getUserObjectId()', 10);
                        reject(response.generate(true, 'Failed to find user', 500, null));
                    });
            });
        }

        let getUnspammedUsers = (blockedUsers) => {
            return new Promise((resolve, reject) => {
                UserModel.aggregate([{
                        $lookup: {
                            from: "spams",
                            localField: "_id",
                            foreignField: "user_id",
                            as: "spam"
                        }
                    }, {
                        $match: {
                            "spam.by.user_id": {
                                $ne: req.user._id
                            }
                        }
                    }, {
                        $project: {
                            userId: 1,
                            firstName: 1,
                            lastName: 1,
                            lastSeen: 1,
                            blocked: {
                                $filter: {
                                    input: '$blocked',
                                    as: 'user',
                                    cond: {
                                        $eq: ['$$user.user_id', req.user._id]
                                    }
                                }
                            },
                            _id: 0
                        }
                    }, {
                        $unwind: {
                            path: "$blocked",
                            preserveNullAndEmptyArrays: true
                        }
                    }, {
                        $project: {
                            userId: 1,
                            firstName: 1,
                            lastName: 1,
                            lastSeen: {
                                $cond: [{
                                    $or: [{ $eq: ["$blocked.user_id", req.user._id] }, { $in: ["$userId", blockedUsers] }]
                                }, null, "$lastSeen"]
                            }
                        }
                    }])
                    .then((users) => {
                        if (check.isEmpty(users)) {
                            logger.info('No User Found', 'User Controller: getUnspammedUsers');
                            reject(response.generate(true, 'No User Found', 404, null));
                        } else {
                            logger.info('Users Found', 'User Controller: getUnspammedUsers');
                            resolve(response.generate(false, 'All User Details Found', 200, users));
                        }
                    })
                    .catch((err) => {
                        logger.error(err.message, 'User Controller: getUnspammedUsers', 10);
                        reject(response.generate(true, 'Failed To Find User Details', 500, null));
                    });
            });
        }


        getUserObjectId()
            .then(getUnspammedUsers)
            .then((response) => {
                res.status(200);
                res.send(response);
            })
            .catch((err) => {
                res.status(err.status);
                res.send(err);
            });
    },

    getUser: (req, res) => {

        UserModel.findOne({ 'userId': req.user.userId })
            .populate('blocked.user_id', 'userId -_id')
            .populate('groups.group_id', 'groupId name -_id')
            .select('firstName lastName groups blocked.user_id.userId')
            .exec()
            .then((user) => {
                if (check.isEmpty(user)) {
                    logger.info('No User Found', 'User Controller:getUser');
                    res.send(response.generate(true, 'No User Found', 404, null));
                } else {
                    logger.info('User Found', 'User Controller:getUser');
                    res.send(response.generate(false, 'User Details Found', 200, user));
                }
            })
            .catch((err) => {
                res.status(err.status);
                logger.error(err.message, 'User Controller: getUser', 10);
                res.send(response.generate(true, 'Failed To Find User Details', 500, null));
            });
    },

    deleteUser: (req, res) => {

        UserModel.findOneAndDelete({ 'userId': req.user.userId })
            .then((result) => {
                if (check.isEmpty(result)) {
                    logger.info('No User Found', 'User Controller: deleteUser');
                    res.send(response.generate(true, 'No User Found', 404, null));
                } else {
                    logger.info('User Deleted', 'User Controller: deleteUser');
                    res.send(response.generate(false, 'Deleted the user successfully', 200, result));
                }
            })
            .catch((err) => {
                res.status(err.status);
                logger.error(err.message, 'User Controller: deleteUser', 10);
                res.send(response.generate(true, 'Failed To delete user', 500, null));
            });
    },

    editUser: (req, res) => {

        UserModel.findOneAndUpdate(req.user.userId, {
                $set: req.body
            }, { new: true }) //To return updated document
            //.update({ 'userId': req.user.userId }, req.body) //Alternative
            .then((user) => {
                if (check.isEmpty(user)) {
                    logger.info('No User Found', 'User Controller: editUser');
                    res.send(response.generate(true, 'No User Found', 404, null));
                } else {
                    logger.info('User Updated', 'User Controller: editUser');
                    res.send(response.generate(false, 'User details edited', 200, user));
                }
            })
            .catch((err) => {
                res.status(err.status);
                logger.error(err.message, 'User Controller:editUser', 10);
                res.send(response.generate(true, 'Failed To edit user details', 500, null));
            });
    }

}

module.exports = userController;