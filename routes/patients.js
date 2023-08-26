const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync')
const { patientSchema } = require('../schemas');
const { isLoggedIn } = require('../middleware')

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'DermaDetector',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
})


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

const upload = multer({storage: storage});

router.get('/', catchAsync (async(req, res) => {
    console.log("User ID:", req.user._id); // or req.user_id if that is actually the correct field
    console.log('Is authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    const patients = await Patient.find({user: req.user._id})
    console.log("Patients:", patients);
    res.render('patients/index', { patients })
}));

router.get('/new', isLoggedIn, (req, res) => {
    res.render('patients/new');
});

router.post('/', isLoggedIn, upload.single('patient[image]'), validatePatient, catchAsync(async (req, res) => {
    try {
        const patientData = req.body.patient;
        patientData.user = req.user._id;
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
    console.log("Patient:", patient);
    console.log("User:", req.user);
    console.log(typeof patient.user, patient.user);
    console.log(typeof req.user._id, req.user._id);
    if(!patient || !req.user || patient.user.toString() !== req.user._id.toString()) {
        req.flash('error', 'Cannot find patient or you are not authorized!');
        return res.redirect('/patients');
    }
    res.render('patients/show', { patient });
}));

router.get('/:id/edit', isLoggedIn, catchAsync(async (req, res) => {
    const patient = await Patient.findById(req.params.id)
    if(!patient){
        req.flash('error', 'Cannot find patient!');
        return res.redirect('/patients')
    }
    if(patient.user.toString() !== req.user._id.toString()) {
        req.flash('error', 'You do not have permission to edit this patient!');
        return res.redirect(`/patients/${patient._id}`);
    }
    res.render('patients/edit', {patient});
}));

router.put('/:id', isLoggedIn, validatePatient, catchAsync(async (req, res) => {
    const { id } = req.params;
    // Check if the patient exists
    if (!patient) {
        req.flash('error', 'Cannot find patient!');
        return res.redirect('/patients');
    }

    // Check if the logged-in user is the same as the patient's owner
    if (patient.user.toString() !== req.user._id.toString()) {
        req.flash('error', 'You do not have permission to update this patient!');
        return res.redirect(`/patients/${patient._id}`);
    }
    const patient = await Patient.findByIdAndUpdate(id, { ...req.body.patient });
    req.flash('success', 'Successfully updated patient!');
    res.redirect(`/patients/${patient._id}`)
}));

router.delete('/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    await Patient.findByIdAndDelete(id);

    // Check if the patient exists
    if (!patient) {
        req.flash('error', 'Cannot find patient!');
        return res.redirect('/patients');
    }

    // Check if the logged-in user is the same as the patient's owner
    if (patient.user.toString() !== req.user._id.toString()) {
        req.flash('error', 'You do not have permission to delete this patient!');
        return res.redirect(`/patients/${patient._id}`);
    }

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
