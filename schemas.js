const Joi = require('joi')

module.exports.patientSchema = Joi.object({
    name: Joi.string().required(),
    image: Joi.string(),
    age: Joi.number().required(),
    gender: Joi.string().required(),
    diagnosisHistory: Joi.array().items(
        Joi.object({
            image: Joi.string(),
            prediction: Joi.string()
        })
    ),
    extra_notes: Joi.string()
});