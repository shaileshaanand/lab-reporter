const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");

const { NotFoundError } = require("../errors");
const { sanitize } = require("../helpers/utils");
const { Template } = require("../models");

const templateBodyValidator = Joi.object({
  name: Joi.string().min(3).required(),
  content: Joi.string().required(),
});

const newTemplate = async (req, res) => {
  Joi.assert(req.body, templateBodyValidator);
  const template = await Template.create(req.body);
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
  Joi.assert(req.body, templateBodyValidator);
  const template = await Template.findOneAndUpdate({ _id: req.params.id, deleted: false }, req.body, {
    new: true,
  }).lean();
  res.status(StatusCodes.OK).json(sanitize(template));
};

const deleteTemplate = async (req, res) => {
  await Template.findOneAndUpdate({ _id: req.params.id, deleted: false }, { deleted: true });
  res.status(StatusCodes.NO_CONTENT).send();
};

module.exports = { newTemplate, listTemplates, getTemplate, updateTemplate, deleteTemplate };
