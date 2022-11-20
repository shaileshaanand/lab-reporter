const { URLSearchParams } = require("url");

const { faker } = require("@faker-js/faker");
const dayjs = require("dayjs");
const { StatusCodes } = require("http-status-codes");
const supertest = require("supertest");

const app = require("../app");
const { patientFactory, usgReportFactory, doctorFactory, userFactory } = require("../factories");
const { makeDoctor } = require("../factories/Doctor");
const { randomFileId } = require("../factories/helpers");
const { makePatient } = require("../factories/Patient");
const { makeTemplate } = require("../factories/Template");
const googleDocs = require("../helpers/googleDocs");
const googleDrive = require("../helpers/googleDrive");
const { Patient, Doctor, USGReport } = require("../models");

require("dotenv").config();

const client = supertest(app);
const { connectTestDb, disconnectTestDb, clearDb } = require("./helpers");

let token;

jest.mock("../helpers/googleDrive");
jest.mock("../helpers/googleDocs");

describe("USGReport", () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    clearDb();
    const user = await userFactory.makeUser();
    token = `Bearer ${user.issueToken()}`;
  });

  it("create a new USGReport", async () => {
    const patient = await makePatient();
    const referrer = await makeDoctor();
    const template = await makeTemplate();
    const usgReport = {
      patient: patient.id,
      referrer: referrer.id,
      date: faker.date.future(),
      partOfScan: faker.random.word(),
      template: template.id,
    };

    const driveFileId = randomFileId();
    googleDrive.cloneDocument.mockResolvedValue(driveFileId);

    const response = await client.post("/api/v1/usg-report").set("Authorization", token).send(usgReport);

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    const createdUSGReport = await USGReport.findOne({ _id: response.body.id }).lean();
    expect(createdUSGReport.patient._id.toString()).toBe(patient._id.toString());
    expect(createdUSGReport.referrer._id.toString()).toBe(referrer._id.toString());
    expect(createdUSGReport.date.toISOString()).toBe(usgReport.date.toISOString());
    expect(createdUSGReport.partOfScan).toBe(usgReport.partOfScan);
    expect(createdUSGReport.driveFileId).toBe(driveFileId);
    expect(createdUSGReport.deleted).toBe(false);
    expect(googleDrive.cloneDocument).toHaveBeenCalledTimes(1);
    expect(googleDrive.cloneDocument).toHaveBeenCalledWith(
      template.driveFileId,
      `${patient.name} - ${dayjs(usgReport.date).format("DD-MM-YYYY")}`,
      expect.anything(),
      process.env.GOOGLE_DRIVE_REPORTS_FOLDER_ID,
    );
    expect(googleDocs.documentBatchReplace).toHaveBeenCalledTimes(1);
    expect(googleDocs.documentBatchReplace).toHaveBeenCalledWith(
      createdUSGReport.driveFileId,
      {
        name: patient.name,
        date: dayjs(usgReport.date).format("DD/MM/YYYY"),
        referred_by: referrer.name,
        part_of_scan: usgReport.partOfScan,
        age: patient.age,
        sex: patient.gender === "male" ? "M" : "F",
      },
      expect.anything(),
    );
  });

  it("list all USGReports", async () => {
    const usgreport1 = await usgReportFactory.makeUSGReport();
    const usgreport2 = await usgReportFactory.makeUSGReport();
    const usgreport3 = await usgReportFactory.makeUSGReport();
    const usgreportIds = [usgreport1.id, usgreport2.id, usgreport3.id];
    const response = await client.get("/api/v1/usg-report").set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(3);
    response.body.data.forEach((usgReport) => {
      expect(usgReport.id).toBeDefined();
      expect(usgreportIds).toContain(usgReport.id);
      expect(usgReport.patient.id).toBeDefined();
      expect(usgReport.referrer.id).toBeDefined();
      expect(usgReport.date).toBeDefined();
      expect(usgReport.partOfScan).toBeDefined();
      expect(usgReport.driveFileId).toBeDefined();
      expect(usgReport.deleted).toBeUndefined();
    });
  });

  it("list all USGReports with first page and order", async () => {
    await usgReportFactory.makeUSGReport();
    const usgReport2 = await usgReportFactory.makeUSGReport();
    const usgReport3 = await usgReportFactory.makeUSGReport();
    const usgReport4 = await usgReportFactory.makeUSGReport();
    const response = await client.get("/api/v1/usg-report?limit=3").set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(3);
    expect(response.body.hasMore).toBe(true);
    expect(response.body.totalPages).toBe(2);
    expect(response.body.data[0].id).toBe(usgReport4.id);
    expect(response.body.data[1].id).toBe(usgReport3.id);
    expect(response.body.data[2].id).toBe(usgReport2.id);
  });

  it("list all USGReports with last page and order", async () => {
    const usgReport1 = await usgReportFactory.makeUSGReport();
    await usgReportFactory.makeUSGReport();
    await usgReportFactory.makeUSGReport();
    await usgReportFactory.makeUSGReport();
    const response = await client.get("/api/v1/usg-report?limit=3&page=2").set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.totalPages).toBe(2);
    expect(response.body.hasMore).toBe(false);
    expect(response.body.data[0].id).toBe(usgReport1.id);
  });

  it("list all USGReports with page and order", async () => {
    const usgReport1 = await usgReportFactory.makeUSGReport();
    const usgReport2 = await usgReportFactory.makeUSGReport();
    await usgReportFactory.makeUSGReport();
    await usgReportFactory.makeUSGReport();
    const response = await client.get("/api/v1/usg-report?limit=2&page=2").set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(2);
    expect(response.body.totalPages).toBe(2);
    expect(response.body.hasMore).toBe(false);
    expect(response.body.data[0].id).toBe(usgReport2.id);
    expect(response.body.data[1].id).toBe(usgReport1.id);
  });

  it("get a USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    const referrer = await Doctor.findOne({ _id: usgReport.referrer.id });
    const patient = await Patient.findOne({ _id: usgReport.patient.id });
    const response = await client.get(`/api/v1/usg-report/${usgReport.id}`).set("Authorization", token);

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
    expect(response.body.partOfScan).toBe(usgReport.partOfScan);
    expect(response.body.driveFileId).toBe(usgReport.driveFileId);
    expect(response.body.deleted).toBeUndefined();
  });

  it("update a USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    const oldPatient = await Patient.findOne({ _id: usgReport.patient.id });
    const newPatient = await patientFactory.makePatient();
    const newReferrer = await doctorFactory.makeDoctor();

    const newDataPayload = {
      patient: newPatient._id,
      referrer: newReferrer._id,
      date: faker.date.future(),
      partOfScan: faker.lorem.word(),
    };

    const response = await client
      .put(`/api/v1/usg-report/${usgReport.id}`)
      .set("Authorization", token)
      .send(newDataPayload);

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
    expect(response.body.partOfScan).toBe(newDataPayload.partOfScan);
    expect(response.body.deleted).toBeUndefined();
  });

  it("fail to update USGReport's template", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    await usgReport.save();

    const response = await client.put(`/api/v1/usg-report/${usgReport.id}`).set("Authorization", token).send({
      template: randomFileId(),
    });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
  });

  it("delete a USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    const response = await client.delete(`/api/v1/usg-report/${usgReport.id}`).set("Authorization", token);

    expect(response.status).toBe(204);
    const deletedUSGReport = await USGReport.findOne({ _id: usgReport.id });
    expect(deletedUSGReport.deleted).toBe(true);
    expect(googleDrive.moveDocument).toHaveBeenCalledTimes(1);
    expect(googleDrive.moveDocument).toHaveBeenCalledWith(
      usgReport.driveFileId,
      process.env.GOOGLE_DRIVE_REPORTS_FOLDER_ID,
      process.env.GOOGLE_DRIVE_DELETED_REPORTS_FOLDER_ID,
      expect.anything(),
    );
  });

  it("get a deleted USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    usgReport.deleted = true;
    await usgReport.save();
    const response = await client.get(`/api/v1/usg-report/${usgReport.id}`).set("Authorization", token);

    expect(response.status).toBe(404);
  });

  it("update a deleted USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    usgReport.deleted = true;
    await usgReport.save();
    const response = await client.put(`/api/v1/usg-report/${usgReport.id}`).set("Authorization", token).send({
      date: faker.date.future(),
      partOfScan: faker.random.word(),
    });

    expect(response.status).toBe(404);
  });

  it("delete a deleted USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    usgReport.deleted = true;
    await usgReport.save();
    const response = await client.delete(`/api/v1/usg-report/${usgReport.id}`).set("Authorization", token);

    expect(response.status).toBe(404);
  });

  it("get a non-existing USGReport", async () => {
    const response = await client.get(`/api/v1/usg-report/${faker.datatype.uuid()}`).set("Authorization", token);

    expect(response.status).toBe(404);
  });

  it("update a non-existing USGReport", async () => {
    const response = await client.put(`/api/v1/usg-report/${faker.datatype.uuid()}`).set("Authorization", token).send({
      date: faker.date.future(),
      partOfScan: faker.random.word(),
    });

    expect(response.status).toBe(404);
  });

  it("delete a non-existing USGReport", async () => {
    const response = await client.delete(`/api/v1/usg-report/${faker.datatype.uuid()}`).set("Authorization", token);

    expect(response.status).toBe(404);
  });

  it("get all USGReports with filter by patient", async () => {
    const patient = await patientFactory.makePatient();
    const usgReports = await Promise.all([
      usgReportFactory.makeUSGReport({ patient: patient._id }),
      usgReportFactory.makeUSGReport({ patient: patient._id }),
      usgReportFactory.makeUSGReport(),
    ]);

    const usgReportIds = [usgReports[0], usgReports[1]].map((report) => report._id.toString());
    const response = await client
      .get(`/api/v1/usg-report?patient=${patient._id.toString()}`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(2);

    response.body.data.forEach((usgReport) => {
      expect(usgReportIds).toContain(usgReport.id);
    });
  });

  it("get all USGReports with filter by referrer", async () => {
    const referrer = await doctorFactory.makeDoctor();
    const usgReports = await Promise.all([
      usgReportFactory.makeUSGReport({ referrer: referrer._id }),
      usgReportFactory.makeUSGReport({ referrer: referrer._id }),
      usgReportFactory.makeUSGReport(),
    ]);

    const usgReportIds = [usgReports[0], usgReports[1]].map((report) => report._id.toString());
    const response = await client
      .get(`/api/v1/usg-report?referrer=${referrer._id.toString()}`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(2);

    response.body.data.forEach((usgReport) => {
      expect(usgReportIds).toContain(usgReport.id);
    });
  });

  it("get all USGReports with filter by date", async () => {
    const usgReports = await Promise.all([
      usgReportFactory.makeUSGReport({ date: "01-01-2020" }),
      usgReportFactory.makeUSGReport({ date: "01-05-2020" }),
      usgReportFactory.makeUSGReport({ date: "01-06-2020" }),
      usgReportFactory.makeUSGReport({ date: "01-13-2020" }),
      usgReportFactory.makeUSGReport({ date: "01-15-2020" }),
    ]);

    const usgReportIds = [usgReports[1], usgReports[2], usgReports[3]].map((report) => report._id.toString());
    const response = await client
      .get("/api/v1/usg-report?date_before=01-13-2020&date_after=01-05-2020")
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(3);

    response.body.data.forEach((usgReport) => {
      expect(usgReportIds).toContain(usgReport.id);
    });
  });

  it("get all USGReports with filter by partOfScan", async () => {
    const usgReports = await Promise.all([
      usgReportFactory.makeUSGReport({ partOfScan: "Liver" }),
      usgReportFactory.makeUSGReport({ partOfScan: "LivEr" }),
      usgReportFactory.makeUSGReport({ partOfScan: "LIver" }),
      usgReportFactory.makeUSGReport({ partOfScan: "Liverpool" }),
      usgReportFactory.makeUSGReport({ partOfScan: "Kidney" }),
      usgReportFactory.makeUSGReport({ partOfScan: "Kidney" }),
    ]);

    const usgReportIds = usgReports.slice(0, 4).map((report) => report._id.toString());
    const response = await client.get("/api/v1/usg-report?partOfScan=iver").set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(4);

    response.body.data.forEach((usgReport) => {
      expect(usgReportIds).toContain(usgReport.id);
    });
  });

  it("get all USGReports with filter by partOfScan and date", async () => {
    const usgReports = await Promise.all([
      usgReportFactory.makeUSGReport({ partOfScan: "Liver", date: "01-01-2020" }),
      usgReportFactory.makeUSGReport({ partOfScan: "Liver", date: "01-02-2020" }),
      usgReportFactory.makeUSGReport({ partOfScan: "Liver", date: "01-03-2020" }),
      usgReportFactory.makeUSGReport({ partOfScan: "LiVer", date: "01-04-2020" }),
      usgReportFactory.makeUSGReport({ partOfScan: "Liver", date: "01-05-2020" }),
      usgReportFactory.makeUSGReport({ partOfScan: "Kidney", date: "01-06-2020" }),
    ]);

    const usgReportIds = usgReports.slice(1, 3).map((report) => report._id.toString());
    const query = {
      partOfScan: "iver",
      date_before: "01-03-2020",
      date_after: "01-02-2020",
    };

    const response = await client
      .get(`/api/v1/usg-report?${new URLSearchParams(query).toString()}`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(usgReportIds.length);

    response.body.data.forEach((usgReport) => {
      expect(usgReportIds).toContain(usgReport.id);
    });
  });
});
