const { default: faker } = require("@faker-js/faker");

const { Template } = require("../models");

const makeTemplate = ({ name = null, content = null } = {}) => {
  const template = Template.create({
    name: name || faker.name.firstName(),
    content: content || faker.lorem.paragraph(),
  });
  return template;
};

module.exports = { makeTemplate };
