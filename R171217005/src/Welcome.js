import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import "./components/styles.css";

function Render(){
    return(
    ReactDOM.render(<App />, document.getElementById("root"))
    );
}

function Welcome() {
  return (
  <div class="welcome">
    <h1>Welcome to my<span> Portal</span></h1>
    <button  id="button" onClick={Render}>Login to see Greetings</button>
 </div>
  );
}

export default Welcome;
