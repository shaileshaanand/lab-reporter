const Joi = require("joi");

const NotFoundError = require("../errors/not-found");
const { sanitize } = require("../helpers/utils");
const { Doctor } = require("../models");

const newDoctor = async (req, res) => {
  const bodyValidator = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email(),
  });
  Joi.assert(req.body, bodyValidator);
  const doctor = await Doctor.create(req.body);
  res.status(201).json(sanitize(doctor.toObject()));
};

const listDoctors = async (req, res) => {
  const doctors = await Doctor.find({ deleted: false }).lean();
  res.status(200).json(doctors.map((doctor) => sanitize(doctor)));
};

const getDoctor = async (req, res) => {
  const doctor = await Doctor.findOne({ _id: req.params.id, deleted: false }).lean();
  if (!doctor) {
    throw new NotFoundError("Doctor not found");
  }
  res.status(200).json(sanitize(doctor));
};

const updateDoctor = async (req, res) => {
  const bodyValidator = Joi.object({
    name: Joi.string(),
    phone: Joi.string(),
    email: Joi.string().email(),
  });
  Joi.assert(req.body, bodyValidator);
  const doctor = await Doctor.findOneAndUpdate({ _id: req.params.id, deleted: false }, req.body, {
    new: true,
  }).lean();
  res.status(200).json(sanitize(doctor));
};

const deleteDoctor = async (req, res) => {
  await Doctor.findOneAndUpdate({ _id: req.params.id, deleted: false }, { deleted: true });
  res.status(204).send();
};

module.exports = { newDoctor, listDoctors, getDoctor, updateDoctor, deleteDoctor };
