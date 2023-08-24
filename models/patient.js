const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PatientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: {
        type: String,
        default: '/images/defaultpfp.png'
    },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    diagnosisHistory: [{
        image: { type: String },
        prediction: {type: String}
    }],
    extra_notes: String
});

module.exports = mongoose.model('Patient', PatientSchema)