const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");

const { NotFoundError, UnauthenticatedError } = require("../errors");
const { sanitize } = require("../helpers/utils");
const { User, Token } = require("../models");

const login = async (req, res) => {
  const bodyValidator = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });
  Joi.assert(req.body, bodyValidator);
  const { username, password } = req.body;
  const user = await User.findOne({ username }).select("+password");
  if (!user) {
    throw new NotFoundError("User not found");
  }
  if (!(await user.comparePassword(password))) {
    throw new UnauthenticatedError("Invalid password");
  }
  const token = user.issueToken();
  var userObject = sanitize(user.toObject());
  delete userObject.password;
  res.json({ token, user: userObject });
};

const getGoogleLoginUrl = async (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"];
  const { oauth2Client } = req.app.locals;
  const googleLoginUrl = oauth2Client.generateAuthUrl({ access_type: "offline", scope: scopes });
  res.status(StatusCodes.OK).json({
    googleLoginUrl,
  });
};

const googleLogin = async (req, res) => {
  const bodyValidator = Joi.object({
    code: Joi.string().required(),
  });
  Joi.assert(req.body, bodyValidator);
  const code = req.body;
  const { tokens } = await req.app.locals.oauth2Client.getToken(code);
  Token.create({
    content: tokens,
  });
  res.status(StatusCodes.CREATED).send();
};

module.exports = { login, getGoogleLoginUrl, googleLogin };
