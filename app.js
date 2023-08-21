const express = require('express');
const path = require('path')
const mongoose = require('mongoose')
const methodOverride = require('method-override');
const Patient = require('./models/patient');

main().catch(err => console.log(err))
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/skin-diseases');
    console.log("database connected")
}

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads/');
    },
    filename: function(req, file, cb){
        cb(null, Data.now() + '-' + file.originalname);
    }
});

const upload = multer({storage: storage});

const app = express()

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
    res.render('home')
});

app.get('/patients', async (req, res) => {
    const patients = await Patient.find({})
    res.render('patients/index', { patients })
});

app.get('/patients/new', (req, res) => {
    res.render('patients/new');
})

app.post('/patients', async (req, res) => {
    const patient = new Patient(req.body.patient)
    await patient.save();
    res.redirect(`/patients/${patient._id}`)
})

app.get('/patients/:id', async(req, res) => {
    const patient = await Patient.findById(req.params.id)
    res.render('patients/show', { patient });
});

app.get('/patients/:id/edit', async (req, res) => {
    const patient = await Patient.findById(req.params.id)
    res.render('patients/edit', {patient});
})

app.put('/patients/:id', async (req, res) => {
    const { id } = req.params;
    const patient = await Patient.findByIdAndUpdate(id, { ...req.body.patient });
    res.redirect(`/patients/${patient._id}`)
});

app.delete('/patients/:id', async (req, res) => {
    const { id } = req.params;
    await Patient.findByIdAndDelete(id);
    res.redirect('/patients');
})

app.post('/patients/:id/diagnose', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const imagePath = req.file.path;

    try {
        const response = await axios.post('http://127.0.0.1:5000/predict', {
            image: imagePath
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
});


app.listen(3000, () => {
    console.log('Serving on port 3000')
})