<?php
$email = $_POST['email'];
$phone = $_POST['phone'];
if (!empty($email) || !empty($phone))
{
    $host = "database";
    $dbUsername = "DevOps";
    $dbPassword = "DevOps";
    $dbname = "MIDSEM";
    //create connection
    $conn = new mysqli($host, $dbUsername, $dbPassword, $dbname);
    if (mysqli_connect_error())
    {
        die('Connect Error(' . mysqli_connect_errno() . ')' . mysqli_connect_error());
    }
    else
    {
        $sql = "CREATE TABLE studentrecord (
        email VARCHAR(50) UNIQUE,
        phone INT(20)
        ) ";

        if ($conn->query($sql) === true)
        {
            echo "You would be informed soon about the event \n";
            echo "<br>";
            
        }
        else
        {
            echo "Editing into the Student Record: " ;
            echo "<br>";
        }
        
        
        
        $sql="INSERT INTO studentrecord ( email, phone) VALUES ('.$_POST[email]', '.$_POST[phone]')";
        
        if ($conn->query($sql) === true)
        {
            echo "Student Record Added To Database \n";
            echo "<br>";
        }
        else
        {
            echo "STUDENT WITH THIS EMAIL ALREADY EXISTS ";
            echo "<br>";
        }
       }
     }
?>

