const { default: faker } = require("@faker-js/faker");

const USGReport = require("../models/USGReport");

const { makeDoctor } = require("./Doctor");
const { makePatient } = require("./Patient");

const makeUSGReport = async (
  patientId = null,
  referrerId = null,
  date = null,
  sonologistId = null,
  partOfScan = null,
  findings = null,
) => {
  const usgReport = await USGReport.create({
    patient: patientId || (await makePatient())._id,
    referrer: referrerId || (await makeDoctor())._id,
    date: date || faker.date.future(),
    sonologist: sonologistId || (await makeDoctor())._id,
    partOfScan: partOfScan || faker.random.word(),
    findings: findings || faker.random.words(20),
  });
  return usgReport;
};

module.exports = { makeUSGReport };
