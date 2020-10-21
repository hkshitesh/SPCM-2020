const bcrypt = require('bcryptjs')
const saltRounds = 10
let logger = require('./loggerLib')

let passwordLib = {
    hashpassword: (myPlaintextPassword) => {
        let salt = bcrypt.genSaltSync(saltRounds)
        let hash = bcrypt.hashSync(myPlaintextPassword, salt)
        return hash
    },
    comparePassword: (oldPassword, hashpassword) => {
        return bcrypt.compare(oldPassword, hashpassword);
    }
}

module.exports = passwordLib;
