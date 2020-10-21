const mongoose = require('mongoose');
// Allow Promises
mongoose.Promise = global.Promise;
// Connection
mongoose.connect('mongodb+srv://mern-user:1234@cluster0.rjgsf.gcp.mongodb.net/db_test?retryWrites=true&w=majority', { useNewUrlParser: true });
// Validation
mongoose.connection
  .once('open', () => console.log('Connected to the database!'))
  .on('error', err => console.log('Error with the database!', err));
