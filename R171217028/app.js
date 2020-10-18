const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors')

//Config
const appConfig = require('./config/configApp');
 var whitelist = ['http://localhost', 'http://localhost:3000', 'http://184.72.85.251:3000']; //for cross origin access
 var corsOptions = {
     origin: function(origin, callback) {
         if (whitelist.indexOf(origin) !== -1) {
             callback(null, true)
         } else {
             callback(new Error('Not allowed by CORS'))
         }
     }
 }
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//Middlewares
app.use(logger(appConfig.environment));
//app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'client')));

//Models
const UserModel = require('./models/User');
const AuthModel = require('./models/Auth');
const SingleChatModel = require('./models/SingleChat');
const GroupChatModel = require('./models/GroupChat');
const SpamModel = require('./models/Spam');
const GroupModel = require('./models/Group');

//Routes
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const chatRouter = require('./routes/chat');
const groupRouter = require('./routes/group');
app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/chat', chatRouter);
app.use('/group', groupRouter);


//Mongoose connection
const connect = mongoose.connect(appConfig.db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});
connect.then((db) => {
    console.log("Mongoose connection successfully opened");
}, (err) => { console.log(err); });


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
