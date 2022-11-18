const { google } = require("googleapis");

const { Token } = require("../models");

const { getLastInsertedDocument } = require("./utils");

const driveClient = (oauth2Client) => {
  return google.drive({ version: "v3", auth: oauth2Client });
};

const createBlankDocument = async (name, oauth2Client, folderId) => {
  const token = await getLastInsertedDocument(Token);
  oauth2Client.setCredentials(token.content);
  return (
    await driveClient(oauth2Client).files.create({
      resource: {
        name,
        parents: [folderId],
        mimeType: "application/vnd.google-apps.document",
      },
    })
  ).data.id;
};

module.exports = { createBlankDocument };
