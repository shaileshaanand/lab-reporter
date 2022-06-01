const Joi = require("joi");

const { NotFoundError } = require("../errors");
const { sanitize } = require("../helpers/utils");
const { USGReport } = require("../models");

const newUSGReport = async (req, res) => {
  const bodyValidator = Joi.object({
    patient: Joi.string().required(),
    referrer: Joi.string().required(),
    date: Joi.date().required(),
    sonologist: Joi.string().required(),
    partOfScan: Joi.string().required(),
    findings: Joi.string().required(),
  });
  Joi.assert(req.body, bodyValidator);
  const usgReport = await (await USGReport.create(req.body)).populate(["patient", "referrer", "sonologist"]);

  res.status(201).json(sanitize(usgReport.toObject()));
};

const getUSGReport = async (req, res) => {
  const usgReport = await USGReport.findOne({ _id: req.params.id, deleted: false }).populate([
    "patient",
    "referrer",
    "sonologist",
  ]);
  if (!usgReport) {
    throw new NotFoundError("USG Report not found");
  }
  res.send(sanitize(usgReport.toObject()));
};

const updateUSGReport = async (req, res) => {
  const bodyValidator = Joi.object({
    patient: Joi.string(),
    referrer: Joi.string(),
    date: Joi.date(),
    sonologist: Joi.string(),
    partOfScan: Joi.string(),
    findings: Joi.string(),
  });
  Joi.assert(req.body, bodyValidator);
  const usgReport = await USGReport.findOneAndUpdate({ _id: req.params.id, deleted: false }, req.body, {
    new: true,
  }).populate(["patient", "referrer", "sonologist"]);
  if (!usgReport) {
    throw new NotFoundError("USG Report not found");
  }
  res.send(sanitize(usgReport.toObject()));
};

const deleteUSGReport = async (req, res) => {
  const usgReport = await USGReport.findOneAndUpdate(
    { _id: req.params.id, deleted: false },
    { deleted: true },
    { new: true },
  );
  if (!usgReport) {
    throw new NotFoundError("USG Report not found");
  }
  res.status(204).send();
};

const listUSGReports = async (req, res) => {
  const paramsValidator = Joi.object({
    patient: Joi.string(),
    referrer: Joi.string(),
    sonologist: Joi.string(),
    partOfScan: Joi.string(),
    date_before: Joi.date(),
    date_after: Joi.date(),
    findings: Joi.string(),
  });
  Joi.assert(req.query, paramsValidator);
  const query = { deleted: false, date: {} };
  if (req.query.patient) {
    query.patient = req.query.patient;
  }
  if (req.query.referrer) {
    query.referrer = req.query.referrer;
  }
  if (req.query.sonologist) {
    query.sonologist = req.query.sonologist;
  }
  if (req.query.partOfScan) {
    query.partOfScan = { $regex: req.query.partOfScan, $options: "i" };
  }
  if (req.query.date_before) {
    query.date = { ...query.date, $lte: req.query.date_before };
  }
  if (req.query.date_after) {
    query.date = { ...query.date, $gte: req.query.date_after };
  }
  if (req.query.findings) {
    query.findings = { $regex: req.query.findings, $options: "i" };
  }
  if (Object.keys(query.date).length === 0) {
    delete query.date;
  }
  const usgReports = await USGReport.find(query).populate(["patient", "referrer", "sonologist"]);
  res.send(usgReports.map((usgReport) => sanitize(usgReport.toObject())));
};

module.exports = {
  newUSGReport,
  getUSGReport,
  updateUSGReport,
  deleteUSGReport,
  listUSGReports,
};
