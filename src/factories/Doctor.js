const { default: faker } = require("@faker-js/faker");

const Doctor = require("../models/Doctor");

const makeDoctor = async (name = null, phone = null, email = null) => {
  const doctor = await Doctor.create({
    name: name || faker.name.firstName(),
    phone: phone || faker.phone.phoneNumber("9#########"),
    email: email || faker.internet.email(),
  });
  return doctor;
};

module.exports = { makeDoctor };
