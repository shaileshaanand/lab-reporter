const Joi = require("joi");

const { NotFoundError } = require("../errors");
const { sanitize } = require("../helpers/utils");
const { Patient } = require("../models");

const patientBodyValidator = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  email: Joi.string().email(),
  age: Joi.number().min(0).max(120),
  gender: Joi.string().valid("male", "female"),
});

const newPatient = async (req, res) => {
  Joi.assert(req.body, patientBodyValidator);
  const patient = await Patient.create(req.body);
  res.status(201).json(sanitize(patient.toObject()));
};

const listPatients = async (req, res) => {
  const patients = await Patient.find({ deleted: false }).lean();
  res.status(200).json(patients.map((patient) => sanitize(patient)));
};

const deletePatient = async (req, res) => {
  await Patient.findOneAndUpdate({ _id: req.params.id, deleted: false }, { deleted: true });
  res.status(204).send();
};

const updatePatient = async (req, res) => {
  Joi.assert(req.body, patientBodyValidator);
  const patient = await Patient.findOneAndUpdate({ _id: req.params.id, deleted: false }, req.body, {
    new: true,
  }).lean();
  res.status(200).json(sanitize(patient));
};
const getPatient = async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, deleted: false }).lean();
  if (!patient) {
    throw new NotFoundError("Patient not found");
  }
  res.status(200).json(sanitize(patient));
};

module.exports = {
  newPatient,
  listPatients,
  deletePatient,
  updatePatient,
  getPatient,
};
