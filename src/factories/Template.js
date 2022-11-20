const { default: faker } = require("@faker-js/faker");

const { Template } = require("../models");

const { randomFileId } = require("./helpers");

const makeTemplate = ({ name = null, driveFileId = null } = {}) => {
  const template = Template.create({
    name: name || faker.name.firstName(),
    driveFileId: driveFileId || randomFileId,
  });
  return template;
};

module.exports = { makeTemplate };
