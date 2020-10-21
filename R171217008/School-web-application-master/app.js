const express = require("express");
require('dotenv').config()
const ejs = require("ejs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const request = require("request");
const https = require("https");
const session = require("express-session");
const flash = require('express-flash');
const cookieParser = require('cookie-parser')
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const validator = require('validator');
const { check, validationResult, matchedData } = require("express-validator");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser( "keyboard cat"));
app.set("view engine", "ejs");
app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 60000}
}));

app.use(flash());





app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/studentDb", {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});

const studentSchema = new mongoose.Schema({
    parentName: {
        type: String,
        require: true
    },
    studentName: {
        type: String,
        require: true
    },
    telephone: {
        type: String,
        require: true
    },
    email: String,
    password: String
});

studentSchema.plugin(passportLocalMongoose);
const Student = mongoose.model("Student", studentSchema);

passport.use(Student.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
   
passport.deserializeUser(function(id, done) {
    Student.findById(id, function (err, user) {
        done(err, user);
    });
});

// use static serialize and deserialize of model for passport session support
// passport.serializeUser(Student.serializeUser());
// passport.deserializeUser(Student.deserializeUser());



app.get("/", function(req, res){
    res.render("home");
});

app.get("/home", function(eq, res){
    res.render("home");
});

app.get("/about", function(req, res){
    res.render("about", {update: false});
});

app.post("/about", function(req, res){
    const email =  req.body.email;
    const route = req.params.routeId

    const data = {
        members: [{
            email_address: email,
            status: "subscribed"
        }]
    };

    const jsonData = JSON.stringify(data);

    const url = "https://us4.api.mailchimp.com/3.0/lists/" + process.env.AUDIENCE_KEY;
    console.log(url);
    const options = {
        method: "POST",
        auth: "sodiq1:" + process.env.API_KEY
    }

    const request = https.request(url, options, function(responds){

        const status = responds.statusCode;
        const success = "Thank you. You will now be receiving our newsletters via emails.";
        const failure = "You already have sign up / Invalid email."
        if(status === 200){
            res.render("about", {update: status});
        }else{
            res.render("about", {update: "error"});
        }
        
        responds.on("data", function(data){
            // console.log(JSON.parse(data));
        });
    });
    request.write(jsonData);
    request.end();

});

app.get("/staff", function(req, res){
    res.render("staff",  {update: ""});
});

app.post("/staff", function(req, res){
    const email =  req.body.email;
    const route = req.params.routeId

    const data = {
        members: [{
            email_address: email,
            status: "subscribed"
        }]
    };

    const jsonData = JSON.stringify(data);

    const url = "https://us4.api.mailchimp.com/3.0/lists/" + process.env.AUDIENCE_KEY;
    console.log(url);
    const options = {
        method: "POST",
        auth: "sodiq1:" + process.env.API_KEY
    }
    const request = https.request(url, options, function(responds){
        const status = responds.statusCode;
        const success = "Thank you. You will now be receiving our newsletters via emails.";
        const failure = "You already have sign up / Invalid email."
        if(status === 200){
            res.render("staff", {update: status});
        }else{
            res.render("staff", {update: "error"});
        }
        
        responds.on("data", function(data){
            // console.log(JSON.parse(data));
        });
    });
    request.write(jsonData);
    request.end();

});

app.get("/facilities", function(req, res){
    res.render("facilities", {update: ""});
});

app.post("/facilities", function(req, res){
    const email =  req.body.email;
    const route = req.params.routeId

    const data = {
        members: [{
            email_address: email,
            status: "subscribed"
        }]
    };

    const jsonData = JSON.stringify(data);

    const url = "https://us4.api.mailchimp.com/3.0/lists/" + process.env.AUDIENCE_KEY;
    console.log(url);
    const options = {
        method: "POST",
        auth: "sodiq1:" + process.env.API_KEY
    }
    const request = https.request(url, options, function(responds){
        const status = responds.statusCode;
        const success = "Thank you. You will now be receiving our newsletters via emails.";
        const failure = "You already have sign up / Invalid email."
        if(status === 200){
            res.render("facilities", {update: status});
        }else{
            res.render("facilities", {update: "error"});
        }
        
        responds.on("data", function(data){
            // console.log(JSON.parse(data));
        });
    });
    request.write(jsonData);
    request.end();

});

app.get("/admission", function(req, res){
    res.render("admission",  {student: "", errors: "", data: "", mailError: ""});
});

app.post("/admission",

[
    check("email")
        .isEmail()
        .withMessage('That email doesn‘t look right')
        .bail()
        .trim()
        .normalizeEmail(),
    check("parentName")
        .isLength({min: 3})
        .withMessage("That parent name doesn‘t look right"),
    check("studentName")
        .isLength({min: 3})
        .withMessage("That student name doesn‘t look right"),
    check("telephone")
        .exists()
        .withMessage("That Telephone doesn‘t look right")
        .isMobilePhone()
        .withMessage("That Telephone doesn‘t look right"),
    check('password')
        .exists()
        .withMessage('That password doesn‘t look right')
],


function(req, res){

    const errors = validationResult(req);

    if(errors.isEmpty()){
        
        Student.register({username: req.body.email, parentName: req.body.parentName, studentName: req.body.studentName, 
            telephone: req.body.telephone}, req.body.password, function(err, student){
                if(err){
                    console.log(err);
                    let result = "A user with the given username is email registered"
                    res.render("admission", { mailError: result, errors: "", data: ""});
                }else{
                    req.flash("success", "Thanks for the registration. proceed to login!")
                    res.redirect("/login");
                }
            }
        );
    }else{
        console.log(errors);
        res.render("admission", {
            data: req.body,
            errors: errors,
            mailError: ""
        });
    }

    const data = matchedData(req);
    console.log("sanitized", data);

    

    
});

app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", function(req, res){
    const student = new Student({
        username: req.body.username,
        password: req.body.password
    });

    req.login(student, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                console.log(req);
               res.render("portal", {student: req.user});
            })
        }
    });

   
});


app.get("/gallery", function(req, res){
    res.render("gallery",  {update: {}});
});

app.post("/gallery", function(req, res){
    const email =  req.body.email;
    const route = req.params.routeId

    const data = {
        members: [{
            email_address: email,
            status: "subscribed"
        }]
    };

    const jsonData = JSON.stringify(data);
    const url = "https://us4.api.mailchimp.com/3.0/lists/" + process.env.AUDIENCE_KEY;
    console.log(url);
    const options = {
        method: "POST",
        auth: "sodiq1:" + process.env.API_KEY
    }

    const request = https.request(url, options, function(responds){
        const status = responds.statusCode;
        if(status === 200){
            res.render("gallery", {update: status});
        }else{
            res.render("gallery", {update: "error"});
        }
        
        responds.on("data", function(data){
            // console.log(JSON.parse(data));
        });
    });
    request.write(jsonData);
    request.end();

});

app.get("pta", function(req, res){
    res.render("admission", );
});




app.listen(3000, function(req, res){
    console.log("Server start at port: 3000");
});