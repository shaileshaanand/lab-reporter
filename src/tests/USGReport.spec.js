const { faker } = require("@faker-js/faker");
const supertest = require("supertest");

const app = require("../app");
const { patientFactory, usgReportFactory, doctorFactory } = require("../factories");
const { makeDoctor } = require("../factories/Doctor");
const { makePatient } = require("../factories/Patient");
const { Patient, Doctor, USGReport } = require("../models");

require("dotenv").config();

const client = supertest(app);
const { connectTestDb, disconnectTestDb, clearDb } = require("./helpers");

describe("USGReport", () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  afterEach(clearDb);

  it("create a new USGReport", async () => {
    const patient = await makePatient();
    const referrer = await makeDoctor();
    const sonologist = await makeDoctor();
    const usgReport = {
      patient: patient.id,
      referrer: referrer.id,
      date: faker.date.future(),
      sonologist: sonologist.id,
      partOfScan: faker.random.word(),
      findings: faker.random.words(20),
    };

    const response = await client.post("/api/v1/usg-report").send(usgReport);

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    const createdUSGReport = await USGReport.findOne({ _id: response.body.id }).lean();
    expect(createdUSGReport.patient._id.toString()).toBe(patient._id.toString());
    expect(createdUSGReport.referrer._id.toString()).toBe(referrer._id.toString());
    expect(createdUSGReport.date.toISOString()).toBe(usgReport.date.toISOString());
    expect(createdUSGReport.sonologist._id.toString()).toBe(sonologist._id.toString());
    expect(createdUSGReport.partOfScan).toBe(usgReport.partOfScan);
    expect(createdUSGReport.findings).toBe(usgReport.findings);
    expect(createdUSGReport.deleted).toBe(false);
  });

  it("list all USGReports", async () => {
    const usgreport1 = await usgReportFactory.makeUSGReport();
    const usgreport2 = await usgReportFactory.makeUSGReport();
    const usgreport3 = await usgReportFactory.makeUSGReport();
    const usgreportIds = [usgreport1.id, usgreport2.id, usgreport3.id];
    const response = await client.get("/api/v1/usg-report");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach((usgReport) => {
      expect(usgReport.id).toBeDefined();
      expect(usgreportIds).toContain(usgReport.id);
      expect(usgReport.patient.id).toBeDefined();
      expect(usgReport.referrer.id).toBeDefined();
      expect(usgReport.date).toBeDefined();
      expect(usgReport.sonologist.id).toBeDefined();
      expect(usgReport.partOfScan).toBeDefined();
      expect(usgReport.findings).toBeDefined();
      expect(usgReport.deleted).toBeUndefined();
    });
  });

  it("get a USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    const referrer = await Doctor.findOne({ _id: usgReport.referrer.id });
    const sonologist = await Doctor.findOne({ _id: usgReport.sonologist.id });
    const patient = await Patient.findOne({ _id: usgReport.patient.id });
    const response = await client.get(`/api/v1/usg-report/${usgReport.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).toBe(usgReport.id);
    expect(response.body.patient.id).toBe(patient._id.toString());
    expect(response.body.patient.name).toBe(patient.name);
    expect(response.body.patient.phone).toBe(patient.phone);
    expect(response.body.patient.email).toBe(patient.email);
    expect(response.body.patient.age).toBe(patient.age);
    expect(response.body.patient.gender).toBe(patient.gender);
    expect(response.body.patient.deleted).toBeUndefined();
    expect(response.body.referrer.id).toBe(referrer._id.toString());
    expect(response.body.referrer.name).toBe(referrer.name);
    expect(response.body.referrer.phone).toBe(referrer.phone);
    expect(response.body.referrer.email).toBe(referrer.email);
    expect(response.body.referrer.deleted).toBeUndefined();
    expect(response.body.date).toBe(usgReport.date.toISOString());
    expect(response.body.sonologist.id).toBe(sonologist._id.toString());
    expect(response.body.sonologist.name).toBe(sonologist.name);
    expect(response.body.sonologist.phone).toBe(sonologist.phone);
    expect(response.body.sonologist.email).toBe(sonologist.email);
    expect(response.body.sonologist.deleted).toBeUndefined();
    expect(response.body.partOfScan).toBe(usgReport.partOfScan);
    expect(response.body.findings).toBe(usgReport.findings);
    expect(response.body.deleted).toBeUndefined();
  });

  it("update a USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    const oldPatient = await Patient.findOne({ _id: usgReport.patient.id });
    const newPatient = await patientFactory.makePatient();
    const newReferrer = await doctorFactory.makeDoctor();
    const newSonologist = await doctorFactory.makeDoctor();

    const newDataPayload = {
      patient: newPatient._id,
      referrer: newReferrer._id,
      sonologist: newSonologist._id,
      date: faker.date.future(),
      partOfScan: faker.lorem.word(),
      findings: faker.lorem.sentence(),
    };

    const response = await client.put(`/api/v1/usg-report/${usgReport.id}`).send(newDataPayload);

    expect(response.status).toBe(200);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).toBe(usgReport.id);
    expect(response.body.patient.id).not.toBe(oldPatient._id.toString());
    expect(response.body.patient.id).toBe(newPatient._id.toString());
    expect(response.body.patient.name).toBe(newPatient.name);
    expect(response.body.patient.phone).toBe(newPatient.phone);
    expect(response.body.patient.email).toBe(newPatient.email);
    expect(response.body.patient.age).toBe(newPatient.age);
    expect(response.body.patient.gender).toBe(newPatient.gender);
    expect(response.body.patient.deleted).toBeUndefined();
    expect(response.body.referrer.id).toBe(newReferrer._id.toString());
    expect(response.body.referrer.name).toBe(newReferrer.name);
    expect(response.body.referrer.phone).toBe(newReferrer.phone);
    expect(response.body.referrer.email).toBe(newReferrer.email);
    expect(response.body.referrer.deleted).toBeUndefined();
    expect(response.body.date).toBe(newDataPayload.date.toISOString());
    expect(response.body.sonologist.id).toBe(newSonologist._id.toString());
    expect(response.body.sonologist.name).toBe(newSonologist.name);
    expect(response.body.sonologist.phone).toBe(newSonologist.phone);
    expect(response.body.sonologist.email).toBe(newSonologist.email);
    expect(response.body.sonologist.deleted).toBeUndefined();
    expect(response.body.partOfScan).toBe(newDataPayload.partOfScan);
    expect(response.body.findings).toBe(newDataPayload.findings);
    expect(response.body.deleted).toBeUndefined();
  });

  it("delete a USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    const response = await client.delete(`/api/v1/usg-report/${usgReport.id}`);

    expect(response.status).toBe(204);
    const deletedUSGReport = await USGReport.findOne({ _id: usgReport.id });
    expect(deletedUSGReport.deleted).toBe(true);
  });

  it("get a deleted USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    usgReport.deleted = true;
    await usgReport.save();
    const response = await client.get(`/api/v1/usg-report/${usgReport.id}`);

    expect(response.status).toBe(404);
  });

  it("update a deleted USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    usgReport.deleted = true;
    await usgReport.save();
    const response = await client.put(`/api/v1/usg-report/${usgReport.id}`).send({
      date: faker.date.future(),
      partOfScan: faker.random.word(),
      findings: faker.random.words(20),
    });

    expect(response.status).toBe(404);
  });

  it("delete a deleted USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    usgReport.deleted = true;
    await usgReport.save();
    const response = await client.delete(`/api/v1/usg-report/${usgReport.id}`);

    expect(response.status).toBe(404);
  });

  it("get a non-existing USGReport", async () => {
    const response = await client.get(`/api/v1/usg-report/${faker.datatype.uuid()}`);

    expect(response.status).toBe(404);
  });

  it("update a non-existing USGReport", async () => {
    const response = await client.put(`/api/v1/usg-report/${faker.datatype.uuid()}`).send({
      date: faker.date.future(),
      partOfScan: faker.random.word(),
      findings: faker.random.words(20),
    });

    expect(response.status).toBe(404);
  });

  it("delete a non-existing USGReport", async () => {
    const response = await client.delete(`/api/v1/usg-report/${faker.datatype.uuid()}`);

    expect(response.status).toBe(404);
  });
});
