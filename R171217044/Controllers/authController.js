const mysql = require("mysql");

var mysqlConnection =  mysql.createConnection({
    host : 'database-node.cu3tii08dxzj.us-east-1.rds.amazonaws.com',
    port : '3306',
    user : 'admin',
    password : 'password',
    database : 'Users',
});
exports.register= async (req, res)=>{
    console.log(req.body);
    const {name, email,password,passwordConfirm}=req.body;
    mysqlConnection.query("SELECT email from users where email = ?",[email],(err, result)=>{
        if(err)
        {
            console.log(err);
        }
        if(result.length > 0)
        {
            return res.render('register',{
                message: "That email is already registered"
            });
        } else if (password !== passwordConfirm)
        {
            return res.render('register',{
                message: "Passwords Do Not Match"
            });
        }
        mysqlConnection.query('INSERT INTO users SET ?',{name: name,email: email,password: password},(error, result)=>{
        if (error){
            console.log(error);
        }
        else {
            console.log(result);
            res.render('register',{
                message: "User Registered"
            });
        }
    });
    });
    
}
exports.login= async (req, res)=>{
    try{
        const {email,password}=req.body;
        if(!email || !password)
        {
            return res.status(400).render('login',{
                message:'Please provide an email and password'
            })
        }

        mysqlConnection.query('SELECT * FROM users where email = ?',[email], async (error, results)=>{
            console.log(results);
            if(error)
            {
                console.log(error);
            }
            else if(!res || password!=results[0].password )
            {
                return res.status(401).render('login',{
                    message:'Email or Password is Incorrect'
                })
            }
            else{
                return res.render('loginpage')
            }
        });

    }
    catch (err){
        console.log(err);
    }
}