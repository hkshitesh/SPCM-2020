const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const request = require("request")

//Model
const Auth = mongoose.model('Auth')

//Libraries
const logger = require('../libs/loggerLib')
const response = require('../libs/responseLib')
const token = require('../libs/tokenLib')
const check = require('../libs/checkLib')


let isAuthorized = (req, res, next) => {

    if (req.params.authToken || req.query.authToken || req.body.authToken || req.header('authToken')) {

        Auth.findOne({ authToken: req.header('authToken') || req.params.authToken || req.body.authToken || req.query.authToken })
            .then((auth) => {
                if (check.isEmpty(auth)) {
                    logger.error('No Authorization Key Is Present', 'AuthorizationMiddleware', 10);
                    res.send(response.generate(true, 'Invalid Or Expired AuthorizationKey', 404, null));
                } else {
                    token.verifyToken(auth.authToken, auth.tokenSecret)
                        .then((decoded) => {
                            logger.info('authToken Verfied', 'Authorization Middleware', 10);
                            req.user = {
                                userId: decoded.data.userId,
                                userName: `${decoded.data.firstName} ${decoded.data.lastName}`
                            }
                            next();
                        })
                        .catch((err) => {
                            logger.error(err.message, 'Authorization Middleware', 10);
                            res.send(response.generate(true, 'Failed To Authorized', 500, null));
                        })
                }
            })
            .catch((err) => {
                logger.error(err.message, 'AuthorizationMiddleware', 10);
                res.send(response.generate(true, 'Failed To Authorized', 500, null));
            });
    } else {
        logger.error('AuthorizationToken Missing', 'AuthorizationMiddleware', 5)
        res.send(response.generate(true, 'AuthorizationToken Is Missing In Request', 400, null));
    }
}

module.exports = {
    isAuthorized: isAuthorized
}