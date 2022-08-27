const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/user');

const healthSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    bmi : {type : Number},
    height: {type: Number},
    weight: {type: Number},
    age: {type: Number},
    gender: {type: String}
})

const Model = mongoose.model('healthSchema',healthSchema);
module.exports = Model