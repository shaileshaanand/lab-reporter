const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
    minlength: 6,
  },
});

UserSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  } else {
    next();
  }
});

UserSchema.methods.comparePassword = async function (password) {
  const user = this;
  return await bcrypt.compare(password, user.password);
};

UserSchema.methods.issueToken = function () {
  const user = this;
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  return token;
};

module.exports = mongoose.model("User", UserSchema);
