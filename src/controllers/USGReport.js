const dayjs = require("dayjs");
const Joi = require("joi");

const { MAX_PAGE_SIZE, PAGE_SIZE } = require("../config/constants");
const { NotFoundError } = require("../errors");
const { documentBatchReplace } = require("../helpers/googleDocs");
const { cloneDocument, moveDocument } = require("../helpers/googleDrive");
const { sanitize } = require("../helpers/utils");
const { USGReport, Template, Patient, Doctor } = require("../models");

const newUSGReport = async (req, res) => {
  const bodyValidator = Joi.object({
    patient: Joi.string().required(),
    referrer: Joi.string().required(),
    date: Joi.date().required(),
    partOfScan: Joi.string().required(),
    template: Joi.string().required(),
  });
  Joi.assert(req.body, bodyValidator);
  const [template, patient, referrer] = await Promise.all([
    Template.findById(req.body.template).lean(),
    Patient.findById(req.body.patient).lean(),
    Doctor.findById(req.body.referrer).lean(),
  ]);
  delete req.body.template;
  const driveFileId = await cloneDocument(
    template.driveFileId,
    `${patient.name} - ${dayjs(req.body.date).format("DD-MM-YYYY")}`,
    req.app.locals.oauth2Client,
    process.env.GOOGLE_DRIVE_REPORTS_FOLDER_ID,
  );

  documentBatchReplace(
    driveFileId,
    {
      name: patient.name,
      date: dayjs(req.body.date).format("DD/MM/YYYY"),
      referred_by: referrer.name,
      part_of_scan: req.body.partOfScan,
      age: patient.age,
      sex: patient.gender === "male" ? "M" : "F",
    },
    req.app.locals.oauth2Client,
  );

  const usgReport = await (await USGReport.create({ ...req.body, driveFileId })).populate(["patient", "referrer"]);

  res.status(201).json(sanitize(usgReport.toObject()));
};

const getUSGReport = async (req, res) => {
  const usgReport = await USGReport.findOne({ _id: req.params.id, deleted: false }).populate(["patient", "referrer"]);
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
    partOfScan: Joi.string(),
  });
  Joi.assert(req.body, bodyValidator);
  const usgReport = await USGReport.findOneAndUpdate({ _id: req.params.id, deleted: false }, req.body, {
    new: true,
  }).populate(["patient", "referrer"]);
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
  moveDocument(
    usgReport.driveFileId,
    process.env.GOOGLE_DRIVE_REPORTS_FOLDER_ID,
    process.env.GOOGLE_DRIVE_DELETED_REPORTS_FOLDER_ID,
    req.app.locals.oauth2Client,
  );
  res.status(204).send();
};

const listUSGReports = async (req, res) => {
  const paramsValidator = Joi.object({
    patient: Joi.string(),
    referrer: Joi.string(),
    partOfScan: Joi.string(),
    date_before: Joi.date(),
    date_after: Joi.date(),
    page: Joi.number().min(1),
    limit: Joi.number().min(1).max(MAX_PAGE_SIZE),
  });
  Joi.assert(req.query, paramsValidator);

  const page = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || PAGE_SIZE);

  const query = { deleted: false, date: {} };
  if (req.query.patient) {
    query.patient = req.query.patient;
  }
  if (req.query.referrer) {
    query.referrer = req.query.referrer;
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
  if (Object.keys(query.date).length === 0) {
    delete query.date;
  }
  const usgReports = await USGReport.find(query)
    .sort({ createdAt: "desc" })
    .skip((page - 1) * limit)
    .limit(limit + 1)
    .populate(["patient", "referrer"])
    .lean();
  let hasMore = false;
  if (usgReports.length === limit + 1) {
    hasMore = true;
    usgReports.pop();
  }
  const total = await USGReport.countDocuments(query);
  const totalPages = Math.ceil(total / limit);
  res.send({ data: usgReports.map((usgReport) => sanitize(usgReport)), hasMore, page, limit, totalPages, total });
};

module.exports = {
  newUSGReport,
  getUSGReport,
  updateUSGReport,
  deleteUSGReport,
  listUSGReports,
};
