import React from "react";
import "./styles.css";


function Greeting() {
const date = new Date();
var hrs = date.getHours();
let greetings;
let classname1;
const customStyle = {
  color: ""
};

if (hrs <= 12) {
  greetings = "Good Morning!";
  classname1 = "greeting1";
  customStyle.color = "yellow";
} else if (hrs <= 18) {
  greetings = "Good Afternoon!";
  classname1 = "greeting2";
  customStyle.color = "green";
} else {
  greetings = "Good Evening!";
  classname1 = "greeting3";
  customStyle.color = "white";
}
  return (
    <div className={classname1}>
      <h1 style={customStyle}>{greetings}</h1>
    </div>
  );
}

export default Greeting;