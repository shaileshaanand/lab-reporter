const { google } = require("googleapis");

const { UnauthenticatedError } = require("../errors");
const { Token } = require("../models");

const { getLastInsertedDocument } = require("./utils");

const docsClient = async (oauth2Client) => {
  const token = await getLastInsertedDocument(Token);
  if (!token) {
    throw new UnauthenticatedError("Google Login Required");
  }
  oauth2Client.setCredentials(token.content);
  return google.docs({ version: "v1", auth: oauth2Client });
};

const documentBatchReplace = async (documentId, values, oauth2Client) => {
  const requests = Object.keys(values).map((key) => ({
    replaceAllText: {
      containsText: {
        text: `{{${key}}}`,
        matchCase: true,
      },
      replaceText: String(values[key]),
    },
  }));
  return (await docsClient(oauth2Client)).documents.batchUpdate({
    documentId,
    requestBody: {
      requests,
    },
  });
};

module.exports = { documentBatchReplace };
