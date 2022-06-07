const { default: faker } = require("@faker-js/faker");

const Patient = require("../models/Patient");

const makePatient = ({ name = null, phone = null, email = null, age = null, gender = null } = {}) => {
  const patient = Patient.create({
    name: name || faker.name.firstName(),
    phone: phone || faker.phone.phoneNumber("9#########"),
    email: email || faker.internet.email(),
    age: age || faker.datatype.number({ min: 0, max: 120 }),
    gender: gender || faker.name.gender(true).toLowerCase(),
  });
  return patient;
};

module.exports = { makePatient };
