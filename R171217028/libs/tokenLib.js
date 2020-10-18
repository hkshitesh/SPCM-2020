const jwt = require('jsonwebtoken')
const shortid = require('shortid')
const mongoose = require('mongoose');
const logger = require('../libs/loggerLib');
const check = require('../libs/checkLib');

//https://github.com/auth0/node-jsonwebtoken

//Config
const appConfig = require('../config/configApp');

//Models
const AuthModel = mongoose.model('Auth');

let tokenLib = {
    generateToken: (data) => {
        return new Promise((resolve, reject) => {
            try {
                //default algorithm: HS256->HMAC using SHA-256 hash algorithm
                let claims = {
                    jwtid: shortid.generate(),
                    iat: Date.now(),
                    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), //Expires in 1 day
                    sub: 'authToken', //Subject
                    iss: 'incubChat', //Organisation->Issuer
                    data: data
                }
                let tokenDetails = {
                    token: jwt.sign(claims, appConfig.authToken.secretKey),
                    tokenSecret: appConfig.authToken.secretKey
                }
                resolve(tokenDetails);
            } catch (err) {
                reject(err);
            }
        });
    },
    verifyToken: (token, secretKey) => {
        return new Promise((resolve, reject) => {
            jwt.verify(token, secretKey, function(err, decoded) {
                if (err) {
                    reject(err);
                } else {
                    resolve(decoded);
                }
            });
        });
    },
    verifyTokenFromDatabase: (token) => {

        return new Promise((resolve, reject) => {
            AuthModel.findOne({ authToken: token })
                .then((auth) => {
                    if (check.isEmpty(auth)) {
                        logger.error('No Authorization Key Is Present', 'tokenLib: verifyTokenFromDatabase()', 10);
                        reject('Invalid Or Expired AuthorizationKey');
                    } else {
                        tokenLib.verifyToken(auth.authToken, auth.tokenSecret)
                            .then((decoded) => {
                                logger.info('authToken Verfied', 'tokenLib: verifyTokenFromDatabase()', 10);
                                resolve(decoded);
                            })
                            .catch((err) => {
                                logger.error(err, 'tokenLib: verifyTokenFromDatabase()', 10);
                                reject('Failed To Authorized');
                            })
                    }
                })
                .catch((err) => {
                    logger.error(err.message, 'tokenLib: verifyTokenFromDatabase()', 10);
                    reject('Failed To Authorized');
                });
        });
    }
}

module.exports = tokenLib;