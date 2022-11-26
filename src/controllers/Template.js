const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");

const { NotFoundError } = require("../errors");
const { createBlankDocument, getDocument, cloneDocument, moveDocument } = require("../helpers/googleDrive");
const { sanitize } = require("../helpers/utils");
const { Template, USGReport } = require("../models");

const templateBodyValidator = Joi.object({
  name: Joi.string().min(3).required(),
  template: Joi.string(),
});

const newTemplate = async (req, res) => {
  Joi.assert(req.body, templateBodyValidator);

  let driveFileId;
  if (req.body.template) {
    const [template, report] = await Promise.all([
      Template.findById(req.body.template),
      USGReport.findById(req.body.template),
    ]);
    driveFileId = await cloneDocument(
      template ? template.driveFileId : report.driveFileId,
      req.body.name,
      req.app.locals.oauth2Client,
      process.env.GOOGLE_DRIVE_TEMPLATES_FOLDER_ID,
    );
    delete req.body.template;
  } else {
    driveFileId = await createBlankDocument(
      req.body.name,
      req.app.locals.oauth2Client,
      process.env.GOOGLE_DRIVE_TEMPLATES_FOLDER_ID,
    );
  }

  const template = await Template.create({ ...req.body, driveFileId });
  res.status(StatusCodes.CREATED).json(sanitize(template.toObject()));
};

const listTemplates = async (req, res) => {
  const templates = await Template.find({ deleted: false }).sort({ createdAt: "desc" }).lean();
  res.status(StatusCodes.OK).json(templates.map((template) => sanitize(template)));
};

const getTemplate = async (req, res) => {
  const template = await Template.findOne({ _id: req.params.id, deleted: false }).lean();
  if (!template) {
    throw new NotFoundError("Template not found");
  }
  res.status(StatusCodes.OK).json(sanitize(template));
};

const updateTemplate = async (req, res) => {
  const bodyValidator = Joi.object({
    name: Joi.string().min(3).required(),
  });
  Joi.assert(req.body, bodyValidator);
  const template = await Template.findOneAndUpdate({ _id: req.params.id, deleted: false }, req.body, {
    new: true,
  }).lean();
  res.status(StatusCodes.OK).json(sanitize(template));
};

const syncTemplate = async (req, res) => {
  const template = await Template.findById(req.params.id);
  const document = await getDocument(template.driveFileId, req.app.locals.oauth2Client);
  template.name = document.data.name;
  template.save();
  res.send(sanitize(template.toObject()));
};

const deleteTemplate = async (req, res) => {
  const template = await Template.findOneAndUpdate({ _id: req.params.id, deleted: false }, { deleted: true });
  if (!template) {
    throw new NotFoundError("Template Not Found");
  }
  moveDocument(
    template.driveFileId,
    process.env.GOOGLE_DRIVE_TEMPLATES_FOLDER_ID,
    process.env.GOOGLE_DRIVE_DELETED_TEMPLATES_FOLDER_ID,
    req.app.locals.oauth2Client,
  );
  res.status(StatusCodes.NO_CONTENT).send();
};

module.exports = { newTemplate, listTemplates, getTemplate, updateTemplate, syncTemplate, deleteTemplate };
