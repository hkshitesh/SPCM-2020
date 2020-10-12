const router = require('express').Router();
let Login = require('../models/login.model');

router.route('/').get((req, res) => {
  Login.find()
    .then(page1 => res.json(page1))
    .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/find').post((req, res) => {
  
  console.log("in /find req res ..req.body.userID: " + req.body.userID);

  Login.findOne({ userID: req.body.userID, password: req.body.password })
    .then(page1 => {res.json(page1), console.log(res.body);})
    .catch(err => res.status(400).json('Error: ' + err));
});

  

router.route('/add').post((req, res) => {
  const userID = req.body.userID;
  const password = req.body.password;

  const newLogin = new Login({
    userID,
    password
  });

  newLogin.save()
  .then(() => res.json('New login id password added!'))
  .catch(err => res.status(400).json('Error: ' + err));
});




module.exports = router;