const { faker } = require("@faker-js/faker");
const { StatusCodes } = require("http-status-codes");
const supertest = require("supertest");

const app = require("../app");
const { patientFactory, userFactory } = require("../factories");
// const doctorFactory = require("../factories/ Patient");
const { Patient } = require("../models");

require("dotenv").config();

const client = supertest(app);
const { connectTestDb, disconnectTestDb, clearDb } = require("./helpers");

let token;

describe("Patient", () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    clearDb();
    const user = await userFactory.makeUser();
    token = `Bearer ${user.issueToken()}`;
  });

  it("create a new Patient", async () => {
    const patient = {
      name: faker.name.firstName(),
      phone: faker.phone.phoneNumber("9#########"),
      email: faker.internet.email(),
      age: faker.datatype.number({ min: 0, max: 120 }),
      gender: faker.name.gender(true).toLowerCase(),
    };

    const response = await client.post("/api/v1/patient").set("Authorization", token).send(patient);

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    const createdPatient = await Patient.findOne({ _id: response.body.id });
    expect(createdPatient.name).toBe(patient.name);
    expect(createdPatient.phone).toBe(patient.phone);
    expect(createdPatient.email).toBe(patient.email);
    expect(createdPatient.age).toBe(patient.age);
    expect(createdPatient.gender).toBe(patient.gender);
    expect(createdPatient.deleted).toBe(false);
  });

  it("should not create patient with invalid phone number", async () => {
    const patient = {
      name: faker.name.firstName(),
      phone: faker.phone.phoneNumber("3#########"),
      email: faker.internet.email(),
      age: faker.datatype.number({ min: 0, max: 120 }),
      gender: faker.name.gender(true).toLowerCase(),
    };
    const response = await client.post("/api/v1/patient").set("Authorization", token).send(patient);
    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect((await Patient.find({})).length).toBe(0);
  });

  it("should create patient without email", async () => {
    const patient = {
      name: faker.name.firstName(),
      phone: faker.phone.phoneNumber("9#########"),
      age: faker.datatype.number({ min: 0, max: 120 }),
      gender: faker.name.gender(true).toLowerCase(),
    };

    const response = await client.post("/api/v1/patient").set("Authorization", token).send(patient);

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    const createdPatient = await Patient.findOne({ _id: response.body.id });

    expect(createdPatient.name).toBe(patient.name);
    expect(createdPatient.phone).toBe(patient.phone);
    expect(createdPatient.email).toBeUndefined();
    expect(createdPatient.age).toBe(patient.age);
    expect(createdPatient.gender).toBe(patient.gender);
    expect(createdPatient.deleted).toBe(false);
  });

  it("list all patients", async () => {
    const patient1 = await patientFactory.makePatient();
    const patient2 = await patientFactory.makePatient();
    const patient3 = await patientFactory.makePatient();
    const patientIds = [patient1.id, patient2.id, patient3.id];
    const response = await client.get("/api/v1/patient").set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(3);
    response.body.data.forEach((patient) => {
      expect(patient.id).toBeDefined();
      expect(patientIds).toContain(patient.id);
      expect(patient.name).toBeDefined();
      expect(patient.phone).toBeDefined();
      expect(patient.email).toBeDefined();
      expect(patient.age).toBeDefined();
      expect(patient.gender).toBeDefined();
      expect(patient.deleted).toBeUndefined();
    });
  });

  it("list all patients with first page and order", async () => {
    await patientFactory.makePatient();
    const patient2 = await patientFactory.makePatient();
    const patient3 = await patientFactory.makePatient();
    const patient4 = await patientFactory.makePatient();
    const response = await client.get("/api/v1/patient?limit=3").set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(3);
    expect(response.body.hasMore).toBe(true);
    expect(response.body.data[0].id).toBe(patient4.id);
    expect(response.body.data[1].id).toBe(patient3.id);
    expect(response.body.data[2].id).toBe(patient2.id);
  });

  it("list all patients with last page and order", async () => {
    const patient1 = await patientFactory.makePatient();
    await patientFactory.makePatient();
    await patientFactory.makePatient();
    await patientFactory.makePatient();
    const response = await client.get("/api/v1/patient?limit=3&page=2").set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.hasMore).toBe(false);
    expect(response.body.data[0].id).toBe(patient1.id);
  });

  it("list all patients with page and order", async () => {
    const patient1 = await patientFactory.makePatient();
    const patient2 = await patientFactory.makePatient();
    await patientFactory.makePatient();
    await patientFactory.makePatient();
    const response = await client.get("/api/v1/patient?limit=2&page=2").set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(2);
    expect(response.body.hasMore).toBe(false);
    expect(response.body.data[0].id).toBe(patient2.id);
    expect(response.body.data[1].id).toBe(patient1.id);
  });

  it("filter all patients with phone number", async () => {
    const phone = faker.phone.phoneNumber("9#########");
    const patients = await Promise.all([
      patientFactory.makePatient({ phone }),
      patientFactory.makePatient({ phone }),
      patientFactory.makePatient({ phone }),
      patientFactory.makePatient(),
    ]);
    const patientIds = patients.slice(0, 3).map((patient) => patient.id);
    const response = await client.get(`/api/v1/patient?phone=${phone}`).set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(3);
    response.body.data.forEach((patient) => {
      expect(patient.id).toBeDefined();
      expect(patientIds).toContain(patient.id);
    });
  });

  it("filter all patients by name", async () => {
    const name = "rahul";
    const patients = await Promise.all([
      patientFactory.makePatient({ name: "Rahul Kumar" }),
      patientFactory.makePatient({ name: "Singh Rahul" }),
      patientFactory.makePatient({ name: "RaHul KUMAR" }),
      patientFactory.makePatient(),
    ]);
    const patientIds = patients.slice(0, 3).map((patient) => patient.id);
    const response = await client.get(`/api/v1/patient?name=${name}`).set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(3);
    response.body.data.forEach((patient) => {
      expect(patient.id).toBeDefined();
      expect(patientIds).toContain(patient.id);
    });
  });

  it("get a patient", async () => {
    const patient = await patientFactory.makePatient();
    const response = await client.get(`/api/v1/patient/${patient.id}`).set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(patient.id);
    expect(response.body.name).toBe(patient.name);
    expect(response.body.phone).toBe(patient.phone);
    expect(response.body.email).toBe(patient.email);
    expect(response.body.age).toBe(patient.age);
    expect(response.body.gender).toBe(patient.gender);
    expect(response.body.deleted).toBeUndefined();
  });

  it("update a patient", async () => {
    const patient = await patientFactory.makePatient();
    const updatedPatient = {
      name: faker.name.firstName(),
      phone: faker.phone.phoneNumber("9#########"),
      email: faker.internet.email(),
      age: faker.datatype.number({ min: 0, max: 120 }),
      gender: patient.gender === "female" ? "male" : "female",
    };
    const response = await client.put(`/api/v1/patient/${patient.id}`).set("Authorization", token).send(updatedPatient);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(patient.id);
    expect(response.body.name).toBe(updatedPatient.name);
    expect(response.body.phone).toBe(updatedPatient.phone);
    expect(response.body.email).toBe(updatedPatient.email);
    expect(response.body.age).toBe(updatedPatient.age);
    expect(response.body.gender).toBe(updatedPatient.gender);
    expect(response.body.deleted).toBeUndefined();
  });

  it("delete a patient", async () => {
    const patient = await patientFactory.makePatient();
    const response = await client.delete(`/api/v1/patient/${patient.id}`).set("Authorization", token);

    expect(response.status).toBe(204);
    const deletedPatient = await Patient.findOne({ _id: patient.id });
    expect(deletedPatient.deleted).toBe(true);
  });

  it("get a deleted patient", async () => {
    const patient = await patientFactory.makePatient();
    await client.delete(`/api/v1/patient/${patient.id}`).set("Authorization", token);
    const response = await client.get(`/api/v1/patient/${patient.id}`).set("Authorization", token);

    expect(response.status).toBe(404);
  });
});
