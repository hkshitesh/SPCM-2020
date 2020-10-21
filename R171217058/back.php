<?php
    session_start();
	
    $db=mysqli_connect("localhost","root","","SPCM");
 if(isset($_POST['submit'])){
	$Name = $_POST['Name'];
	$Course = $_POST['Course'];
	$Contact = $_POST['Contact'];
	$Email = $_POST['Email'];
	$Course = $_POST['Course'];
	$sapid = $_POST['sapid'];
	$year = $_POST['year'];
	$gender =$_POST['gender'];
	$checkbox = $_POST['checkbox'];
	
	if(!empty($Name) && !empty($Course)){
		$sql="INSERT INTO works(Name,Course,Contact,Email,sapid,year,gender,checkbox) VALUES('$Name','$Course','$Contact','$Email','$sapid','$year','$gender','checkbox')";
		mysqli_query($db,$sql);
		echo "Registration Completed Successfully";
	}
	else{
		echo "Please Fill the Name and Course";
	}
	
}
?>


