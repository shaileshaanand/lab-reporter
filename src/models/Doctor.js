const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 255,
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: "Phone number must be 10 digits, starting with 6,7,8 or 9",
    },
  },
  email: {
    type: String,
    required: false,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Doctor", DoctorSchema);
