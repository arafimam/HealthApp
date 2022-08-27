const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/user');

const calorieSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    RequiredCalorie: {type: Number},
    calorieIntake : {type: Number}
})

const Model = mongoose.model('calorieSchema',calorieSchema);
module.exports = Model