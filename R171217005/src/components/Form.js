import React, { Component } from "react";
import ReactDOM from "react-dom";
//import { render } from "react-dom";
import axios from "axios";
import "../components/styles.css";
import Greeting from "./Greeting";

export default class Form extends Component{
  constructor(props) {
    super(props);
    this.onChangeuserID = this.onChangeuserID.bind(this);
    this.onChangepassword = this.onChangepassword.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  
    this.state = {
      userID: '',
      password: '',
      message: ''
    }
  }

  onChangeuserID(e){
    this.setState({userID: e.target.value});
  }

  onChangepassword(e){
    this.setState({password: e.target.value});
  }

  onSubmit(e){
    e.preventDefault();
    
    var user = {
      userID: this.state.userID,
      password: this.state.password
    }
    console.log(user)
    axios.post('http://localhost:5000/page1/find', user)
   .then(res => {console.log(res.data); 
    if (res.data.userID === user.userID){
    console.log("going to dashboard");
    ReactDOM.render(<Greeting/>, document.getElementById("root"));
    }})
    .catch(err => {console.log("errorrr");this.setState({message: "Incorrect Username or password!!"});});

  }
    

   
  
render(){
  return (
    <form className="form" onSubmit={this.onSubmit}>
      <input type="text" placeholder="Username" onChange={this.onChangeuserID}/>
      <input type="password" placeholder="Password" onChange={this.onChangepassword}/>
      <button type="submit">Login</button>
    </form>
  );
  }}