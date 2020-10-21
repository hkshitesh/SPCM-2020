const crypto = require('crypto');

//Config
const appConfig = require('../config/configApp');

let encryptionLib = {
    //https://nodejs.org/api/crypto.html#crypto_crypto_generatekeypairsync_type_options
    generateKeyPair: () => {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: appConfig.authToken.passphrase
            }
        });
        return {
            publicKey: publicKey,
            privateKey: privateKey
        };
    },
    encrypt: (payload, privateKey) => {
        return crypto.privateEncrypt(privateKey, payload);
    },
    decrypt: (encryptedData, publicKey) => {
        return crypto.publicDecrypt(publicKey, encryptedData);
    }
}


module.exports = encryptionLib;