const mysql = require("mysql");
const express = require("express");
const path = require("path");

var app = express();

var port=3000;

var mysqlConnection =  mysql.createConnection({
    host : 'database-node.cu3tii08dxzj.us-east-1.rds.amazonaws.com',
    port : '3306',
    user : 'admin',
    password : 'password',
    database : 'Users',
});

mysqlConnection.connect((err)=>{
    if(err) throw err;
    console.log("connected");
});

const PublicDirectory=path.join(__dirname,'./public');

app.use(express.urlencoded({extended:false}));
app.use(express.json());

app.use(express.static(PublicDirectory));
app.set("view engine","hbs");


app.use('/',require('./routes/routers'));
app.use('/authorize',require('./routes/authorize'));

app.listen(port,()=>{
    console.log("Application started at Port 3000")
});