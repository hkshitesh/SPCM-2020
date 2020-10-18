# Web Chat Application
> Web chat application for chating between single web user or broadcasting it in group.
## Table of contents
* [Files and architecture](#files-and-architecture)
* [Environment](#environment)
* [Installation](#enstallation)
* [Functionality](#functionality)
* [Technologies](#technologies)
* [Authors](#authors)
* [References](#references)

## Files and architecture

* Frontend - jQuery
    *  client
        * css - css styling
        * img - images
        * js - javascript files
        * dasboard.html - chat app interface
        * index.html - login page
        * signup.html - signup page
* Backend - Node.js
    * config - Redis and MongoDB configuration
    * controllers - contains function for each route
    * libs - libraries
    * middlewares - for checking authorization
    * models - Databse Models and schemas
    * routes - api routes
    * app.js - connection and imports

## Environment

* [Node.js](https://nodejs.org/dist/v12.18.0/node-v12.18.0-x64.msi)
* [MongoDB](https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-2012plus-4.2.7-signed.msi)

## Installation

1. Clone or [Download Zip](https://github.com/sauravgarg001/chat-app/archive/master.zip) 
```
git clone https://github.com/sauravgarg001/chat-app.git
```
2. Goto chat-app directory
```
cd chat-app
```
3. Install all dependencies
```
npm install
```
4. [Signup](https://redislabs.com/try-free/) and [Login](https://app.redislabs.com/#/login) on redislabs.com

5. Create database and copy Endpoint and Redis Password, update the given info in *config/configApp.js* file.
```
redis: {
        url: 'redis://<endpoint>',
        password: '<redis password>'
    }
```
6. Run server
```
npm start
```
7. Open given below url on browser
```
http://localhost:3000/
```

## Functionality

* Chating with individual registered users and each chat having seen and delivered status. 
* Able to see online status of all users and if anyone when offline the last seen of user can be seen.
* Any user can be blocked which results in, you will not be able to send or receive any chat from that user and the user and you will not able to see the online or last seen of each other.
* Any user can be reported spam which result in first blocking the user and then removing it from user's list and putting it in spammed users of the database. The spammed user cannot be unspammed later.
* The seen and delivered status is shown with double tick and cyan double tick respectively.
* Groups can be formed with more than one user, so that chat can be broadcasted among the whole. 
* The person who forms the group becomes the admin and has right to dismiss or to make multiple admin. 
* Admin can't dismiss or remove a member who became admin before it.
* Admin can also add more members later once the group is formed.
* A blocked user who is admin can't add members who blocked it.
* For each group chat the seen count, delivered count can be seen and who and when it is delivered to or seen by can be displayed. 
* The chat window shows only limited chats to see more chats scroll upwards.

## Technologies

* [Node.js](https://nodejs.org/en/) - JavaScript runtime
* [jQuery](https://jquery.com/) - JavaScript library
* [JavaScript](https://www.javascript.com/) - Programming language
* [MongoDB](https://www.mongodb.com/) - NoSQL database

## Authors

* **Saurav Garg** - *Initial work* - [sauravgarg001](https://github.com/sauravgarg001)


## References

* Sidebar: https://bootsnipp.com/snippets/Q0dAX
* Update in subdocuments: https://stackoverflow.com/questions/18173482/mongodb-update-deeply-nested-subdocument
* Count subdocument array with conditional field: https://stackoverflow.com/questions/46339175/mongodb-aggregation-conditional-adding-field-based-on-value-in-array
