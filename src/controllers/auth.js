const Joi = require("joi");

const { NotFoundError, UnauthenticatedError } = require("../errors");
const { sanitize } = require("../helpers/utils");
const { User } = require("../models");

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
  res.json({ token, user: sanitize(user.toObject()) });
};

module.exports = { login };
