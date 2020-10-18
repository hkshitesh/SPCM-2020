var express = require('express');
var router = express.Router();

//Controllers
const groupController = require("../controllers/groupController");

//Middlewares
const auth = require('../middlewares/auth')


router.route('/')
    .post(auth.isAuthorized, groupController.createGroup)
    .get(auth.isAuthorized, groupController.getGroup);

router.route('/all').get(auth.isAuthorized, groupController.getAllGroups);

router.route('/add').put(auth.isAuthorized, groupController.addUsers);

router.route('/remove').delete(auth.isAuthorized, groupController.removeUser);

router.route('/leave').delete(auth.isAuthorized, groupController.leaveGroup);

router.route('/admin/make').put(auth.isAuthorized, groupController.makeUserAdmin);

router.route('/admin/remove').put(auth.isAuthorized, groupController.removeUserAdmin);

router.route('/spam').put(auth.isAuthorized, groupController.spamGroup);

router.route('/nonmembers').get(auth.isAuthorized, groupController.getGroupNonMembers);


module.exports = router;