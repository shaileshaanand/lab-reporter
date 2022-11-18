const { google } = require("googleapis");

const { Token } = require("../models");

const makeOauth2Client = (host) => {
  const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET } = process.env;
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    host + "/oauth_callback",
  );

  return oauth2Client;
};

const makeAuthenticatedOauth2Client = async () => {
  const client = makeOauth2Client("");
  client.setCredentials(await Token.find().sort({ _id: -1 }).limit(1).lean());
};

module.exports = { makeOauth2Client, makeAuthenticatedOauth2Client };
