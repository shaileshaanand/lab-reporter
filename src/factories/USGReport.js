const { default: faker } = require("@faker-js/faker");

const USGReport = require("../models/USGReport");

const { makeDoctor } = require("./Doctor");
const { makePatient } = require("./Patient");

const makeUSGReport = async ({
  patient = null,
  referrer = null,
  date = null,
  sonologist = null,
  partOfScan = null,
  findings = null,
} = {}) => {
  const usgReport = await USGReport.create({
    patient: patient || (await makePatient())._id,
    referrer: referrer || (await makeDoctor())._id,
    date: date || faker.date.future(),
    sonologist: sonologist || (await makeDoctor())._id,
    partOfScan: partOfScan || faker.random.word(),
    findings: findings || faker.random.words(20),
  });
  return usgReport;
};

module.exports = { makeUSGReport };
