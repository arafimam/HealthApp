const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/user');

const UserSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true}
})

const Model = mongoose.model('UserSchema',UserSchema);
module.exports = Model