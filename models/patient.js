const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PatientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: Number,
    gender: String,
    diagnosisHistory: [{
        image: { type: String },
        prediction: {type: String}
    }]
});

module.exports = mongoose.model('Patient', PatientSchema)