var express = require('express');
var router = express.Router();

//Controllers
const singleController = require("../controllers/chatSingleController");
const groupController = require("../controllers/chatGroupController");

//Middlewares
const auth = require('../middlewares/auth')


//Single
router.route('/single/seen').get(auth.isAuthorized, singleController.getUserSeenChat);

router.route('/single/seen/mark').put(auth.isAuthorized, singleController.markUserChatSeen);

router.route('/single/delivered/mark').put(auth.isAuthorized, singleController.markUserChatDelivered);

router.route('/single/delivered/mark/all').put(auth.isAuthorized, singleController.markAllUserChatDelivered);

router.route('/single/unseen/count').get(auth.isAuthorized, singleController.countUserUnSeenChat);

router.route('/single/unseen').get(auth.isAuthorized, singleController.getUserUnSeenChat);

router.route('/single/lastchat').get(auth.isAuthorized, singleController.getUserLastChats);

//Group
router.route('/group/seen').get(auth.isAuthorized, groupController.getGroupSeenChat);

router.route('/group/seen/mark').put(auth.isAuthorized, groupController.markGroupChatSeen);

router.route('/group/delivered/mark').put(auth.isAuthorized, groupController.markGroupChatDelivered);

router.route('/group/delivered/mark/all').put(auth.isAuthorized, groupController.markAllGroupChatDelivered);

router.route('/group/unseen/count').get(auth.isAuthorized, groupController.countGroupUnSeenChat);

router.route('/group/unseen').get(auth.isAuthorized, groupController.getGroupUnSeenChat);

router.route('/group/lastchat').get(auth.isAuthorized, groupController.getGroupLastChats);

router.route('/group/:chatId/seenby').get(auth.isAuthorized, groupController.getChatSeenBy);

router.route('/group/:chatId/deliveredto').get(auth.isAuthorized, groupController.getChatDeliveredTo);

module.exports = router;