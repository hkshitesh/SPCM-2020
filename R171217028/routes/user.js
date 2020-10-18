var express = require('express');
var router = express.Router();

//Controllers
const userController = require("../controllers/userController");

//Middlewares
const auth = require('../middlewares/auth')


router.route('/signup').post(userController.signUp);

router.route('/login').post(userController.login);

router.route('/block').put(auth.isAuthorized, userController.blockUser);

router.route('/unblock').put(auth.isAuthorized, userController.unblockUser);

router.route('/spam').put(auth.isAuthorized, userController.spamUser);

router.route('/logout').post(auth.isAuthorized, userController.logout);

router.route('/all').get(auth.isAuthorized, userController.getUsers);

router.route('/')
    .get(auth.isAuthorized, userController.getUser)
    //   .put(auth.isAuthorized, userController.editUser)
    //   .delete(auth.isAuthorized, userController.deleteUser);


module.exports = router;