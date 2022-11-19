const { google } = require("googleapis");

const { Token } = require("../models");

const { getLastInsertedDocument } = require("./utils");

const driveClient = async (oauth2Client) => {
  const token = await getLastInsertedDocument(Token);
  oauth2Client.setCredentials(token.content);
  return google.drive({ version: "v3", auth: oauth2Client });
};

const createBlankDocument = async (name, oauth2Client, folderId) => {
  return (
    await (
      await driveClient(oauth2Client)
    ).files.create({
      resource: {
        name,
        parents: [folderId],
        mimeType: "application/vnd.google-apps.document",
      },
    })
  ).data.id;
};

const cloneDocument = async (sourceDocumentId, name, oauth2Client, folderId) => {
  const resp = await (
    await driveClient(oauth2Client)
  ).files.copy({
    fileId: sourceDocumentId,
    requestBody: {
      name,
      parents: [folderId],
    },
  });
  return resp.data.id;
};

const getDocument = async (documentId, oauth2Client) => {
  return (await driveClient(oauth2Client)).files.get({
    fileId: documentId,
  });
};

module.exports = { createBlankDocument, cloneDocument, getDocument };
