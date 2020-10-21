//Config
const appConfig = require('../config/configApp');

//Libraries
const check = require("./checkLib");
const redis = require('redis');

//Connection
let client = redis.createClient({
    url: appConfig.redis.url,
    auth_pass: appConfig.redis.password
});

client.on('connect', () => {
    console.log("Redis connection successfully opened");
    client.flushdb(function(err, succeeded) {
        console.log("Flushed Redis: " + succeeded);
    });
});


let redisLib = {
    getAllUsersInAHash: (hashName) => {
        return new Promise((resolve, reject) => {
            client.HGETALL(hashName, (err, result) => {
                if (err) {
                    reject(err);
                } else if (check.isEmpty(result)) {
                    resolve({});
                } else {
                    resolve(result);
                }
            });
        });
    },
    setANewOnlineUserInHash: (hashName, key, value) => {
        return new Promise((resolve, reject) => {
            client.HMSET(hashName, [
                key, value
            ], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    },
    deleteUserFromHash: (hashName, key) => {
        client.HDEL(hashName, key);
        return true;
    }
}

module.exports = redisLib;