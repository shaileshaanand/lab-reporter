const Joi = require("joi");

const { PAGE_SIZE, MAX_PAGE_SIZE } = require("../config/constants");
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
  const paramsValidator = Joi.object({
    phone: Joi.string().pattern(/^[6-9]\d{9}$/),
    name: Joi.string(),
    limit: Joi.number().min(1).max(MAX_PAGE_SIZE),
    page: Joi.number().min(1),
  });
  Joi.assert(req.query, paramsValidator);

  const limit = parseInt(req.query.limit || PAGE_SIZE);
  const page = parseInt(req.query.page || 1);

  const query = { deleted: false };
  if (req.query.phone) {
    query.phone = req.query.phone;
  }
  if (req.query.name) {
    query.name = { $regex: req.query.name, $options: "i" };
  }
  const patients = await Patient.find(query)
    .sort({ createdAt: "desc" })
    .skip((page - 1) * limit)
    .limit(limit + 1)
    .lean();
  let hasMore = false;
  if (patients.length === limit + 1) {
    patients.pop();
    hasMore = true;
  }
  const totalPages = Math.ceil((await Patient.estimatedDocumentCount(query)) / limit);
  res.status(200).json({ data: patients.map((patient) => sanitize(patient)), hasMore, page, limit, totalPages });
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
