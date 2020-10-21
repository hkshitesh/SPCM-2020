const moment = require('moment')
const momenttz = require('moment-timezone')
const timeZone = 'Asia/Calcutta'

let timeLib = {
    now: () => {
        return moment.utc().format()
    },

    getLocalTime: () => {
        return moment().tz(timeZone).format()
    },

    convertToLocalTime: (time) => {
        return momenttz.tz(time, timeZone).format('LLLL')
    }
}

module.exports = timeLib;