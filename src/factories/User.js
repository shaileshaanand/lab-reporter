const { default: faker } = require("@faker-js/faker");

const User = require("../models/User");

const makeUser = async ({ firstName = null, lastName = null, username = null, password = null } = {}) => {
  const user = await User.create({
    firstName: firstName || faker.name.firstName(),
    lastName: lastName || faker.name.lastName(),
    username: username || faker.internet.userName(),
    password: password || faker.internet.password(),
  });
  return user;
};

module.exports = { makeUser };
