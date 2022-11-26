const { google } = require("googleapis");

const { UnauthenticatedError } = require("../errors");
const { Token } = require("../models");

const { getLastInsertedDocument } = require("./utils");

const driveClient = async (oauth2Client) => {
  const token = await getLastInsertedDocument(Token);
  if (!token) {
    throw new UnauthenticatedError("Google Login Required");
  }
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

const moveDocument = async (documentId, sourceFolderId, destFolderId, oauth2Client) => {
  return (
    await (
      await driveClient(oauth2Client)
    ).files.update({
      addParents: destFolderId,
      removeParents: sourceFolderId,
      fileId: documentId,
      fields: "name,parents",
    })
  ).data;
};

module.exports = { createBlankDocument, cloneDocument, getDocument, moveDocument };
