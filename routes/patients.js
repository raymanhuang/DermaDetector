const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync')
const { patientSchema } = require('../schemas');
const { isLoggedIn } = require('../middleware')

const ExpressError = require('../utils/ExpressError')
const Campground = require('../models/patient')
const validatePatient = (req, res, next) => {
    // console.log("Request Body:", req.body)
    const { error } = patientSchema.validate(req.body);
    if (error) {
        console.log("Validation error details:", error.details)
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

const multer = require('multer');
const Patient = require("../models/patient");
const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads/');
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({storage: storage});

router.get('/', catchAsync (async(req, res) => {
    const patients = await Patient.find({})
    res.render('patients/index', { patients })
}));

router.get('/new', isLoggedIn, (req, res) => {
    res.render('patients/new');
});

router.post('/', isLoggedIn, upload.single('patient[image]'), validatePatient, catchAsync(async (req, res) => {
    try {
        const patientData = req.body.patient;
        if (req.file) {
            patientData.image = req.file.path;
        } else if (!patientData.image) {
            patientData.image = '/images/defaultpfp.png';
        }
        const patient = new Patient(patientData);
        await patient.save();
        req.flash('success', 'Successfully added a patient!')
        res.redirect(`/patients/${patient._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding patient")
    }
}));

router.get('/:id', catchAsync(async (req, res) => {
    const patient = await Patient.findById(req.params.id)
    if(!patient){
        req.flash('error', 'Cannot find patient!');
        return res.redirect('/patients')
    }
    res.render('patients/show', { patient });
}));

router.get('/:id/edit', isLoggedIn, catchAsync(async (req, res) => {
    const patient = await Patient.findById(req.params.id)
    if(!patient){
        req.flash('error', 'Cannot find patient!');
        return res.redirect('/patients')
    }
    res.render('patients/edit', {patient});
}));

router.put('/:id', isLoggedIn, validatePatient, catchAsync(async (req, res) => {
    const { id } = req.params;
    const patient = await Patient.findByIdAndUpdate(id, { ...req.body.patient });
    req.flash('success', 'Successfully updated patient!');
    res.redirect(`/patients/${patient._id}`)
}));

router.delete('/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    await Patient.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted patient!');
    res.redirect('/patients');
}));

router.post('/:id/diagnose', isLoggedIn, upload.single('image'), catchAsync(async (req, res) => {
    const { id } = req.params;
    const imagePath = req.file.path;

    const form_data = new FormData();
    form_data.append('image', fs.createReadStream(imagePath))

    try {
        const response = await axios.post('http://127.0.0.1:5000/predict', form_data, {
            headers: {
                ...form_data.getHeaders()
            }
        });
        const prediction = response.data.prediction;

        await Patient.findByIdAndUpdate(id, {
            $push: {
                diagnosisHistory: {
                    image: imagePath,
                    prediction: prediction
                }
            }
        });
        res.redirect(`/patients/${id}`);
    } catch (err){
        console.error("error predicting the skin disease", err.message);
        res.status(500).send("Server Error")
    }
}));

module.exports = router;
