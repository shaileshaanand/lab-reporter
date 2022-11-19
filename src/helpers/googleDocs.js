const { google } = require("googleapis");

const { Token } = require("../models");

const { getLastInsertedDocument } = require("./utils");

const docsClient = async (oauth2Client) => {
  const token = await getLastInsertedDocument(Token);
  oauth2Client.setCredentials(token.content);
  return google.docs({ version: "v1", auth: oauth2Client });
};

const documentBatchReplace = async (documentId, values, oauth2Client) => {
  const client = await docsClient(oauth2Client);
  const requests = Object.keys(values).map((key) => ({
    replaceAllText: {
      containsText: {
        text: `{{${key}}}`,
        matchCase: true,
      },
      replaceText: String(values[key]),
    },
  }));
  await client.documents.batchUpdate({
    documentId,
    requestBody: {
      requests,
    },
  });
};

module.exports = { documentBatchReplace };
