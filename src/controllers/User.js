const { sanitize } = require("../helpers/utils");

const getUser = async (req, res) => {
  res.status(200).json(sanitize(req.user.toObject()));
};

module.exports = {
  getUser,
};
