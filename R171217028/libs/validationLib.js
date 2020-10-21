let validationsLib = {
    email: (email) => {
        let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (email.match(emailRegex)) {
            return email;
        } else {
            return false;
        }
    },
    password: (password) => {
        let passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; /* Minimum 8 characters which contain only one capital letter, one special character<br>1 digit and one small letter */
        if (password.match(passwordRegex)) {
            return password;
        } else {
            return false;
        }
    }
}

module.exports = validationsLib;