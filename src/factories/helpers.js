const { faker } = require("@faker-js/faker");

const randomFileId = () => faker.random.alphaNumeric(44);

module.exports = { randomFileId };
