let appConfig = {
    port: 3000,
    allowedCorsOrigin: "*",
    environment: "dev",
    db: {
        url: 'mongodb://127.0.0.1:27017/ChatAppDB'
    },
    redis: {
        url: 'redis://redis-16379.c11.us-east-1-2.ec2.cloud.redislabs.com:16379',
        password: 'PnfS4znVzb9NHgqdGnmYxZqDQsbw0sUs'
    },
    authToken: {
        secretKey: 'IncubsenceChatApp',
        passphrase: 'IncubsenceChatApp'
    },
    apiVersion: '/api/v1'
}

module.exports = appConfig;