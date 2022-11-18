const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema(
  {
    content: {
      access_token: String,
      refresh_token: String,
      scope: String,
      token_type: String,
      expiry_date: Number,
    },
    valid: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Token", TokenSchema);
