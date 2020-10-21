<?php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	$username = $_POST["username"];
    $password = $_POST["password"];
    echo $username;
    echo $password;
//$ip = $_SERVER['REMOTE_ADDR'];
//	$query1="insert into temp values('$username','$password','$ip');";
  //  $query="select * from account where username = $username and password = $password;";//get account corresponding to email  and pwd
   // $dbRef=mysqli_connect("localhost","ishu","root","minor");//to establish connection to database test
//	mysqli_query($dbRef,$query1);
  //  $table=mysqli_query($dbRef,$query);//execute query and store results
   // if(!$table || mysqli_num_rows($table)==0){
     //     echo "Invalid Password or Username!";
       // }
    //else{
      //  echo "You are logged in.";
    //}
}
//mysqli_close($dbRef);
//exec('sudo python3 /var/www/html/ids.py');

//echo exec('python3 pp.py');
?>


<form method="post" action="login_1.php" name="signin-form">
    <div class="form-element">
        <label>Username</label>
        <input type="text" name="username" pattern="[a-zA-Z0-9]+" required value="<?php echo $username;?>" />
    </div>
    <div class="form-element">
        <label>Password</label>
        <input type="password" name="password" required value="<?php echo $password;?>" />
    </div>
    <button type="submit" name="login" value="login">Log In</button>
</form>
