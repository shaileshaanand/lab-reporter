const { faker } = require("@faker-js/faker");
const supertest = require("supertest");

const app = require("../app");
const { doctorFactory } = require("../factories");
const { Doctor } = require("../models");

require("dotenv").config();

const client = supertest(app);
const { connectTestDb, disconnectTestDb, clearDb } = require("./helpers");

describe("Doctor", () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(clearDb);

  it("create a new Doctor", async () => {
    const doctor = {
      name: faker.name.firstName(),
      phone: faker.phone.phoneNumber(),
      email: faker.internet.email(),
    };

    const response = await client.post("/api/v1/doctor").send(doctor);

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    const createdDoctor = await Doctor.findOne({ _id: response.body.id });
    expect(createdDoctor.name).toBe(doctor.name);
    expect(createdDoctor.phone).toBe(doctor.phone);
    expect(createdDoctor.email).toBe(doctor.email);
    expect(createdDoctor.deleted).toBe(false);
  });

  it("fail to craete doctor with invalid email", async () => {
    const doctor = {
      name: faker.name.firstName(),
      phone: faker.phone.phoneNumber(),
      email: "invalid-email",
    };

    const response = await client.post("/api/v1/doctor").send(doctor);

    expect(response.status).toBe(400);
  });

  it("fail to craete doctor with long name", async () => {
    const doctor = {
      name: faker.lorem.words(100),
      phone: faker.phone.phoneNumber(),
      email: faker.internet.email(),
    };

    const response = await client.post("/api/v1/doctor").send(doctor);

    expect(response.status).toBe(400);
  });

  it("list all doctors", async () => {
    const doctor1 = await doctorFactory.makeDoctor();
    const doctor2 = await doctorFactory.makeDoctor();
    const doctor3 = await doctorFactory.makeDoctor();
    const doctorIds = [doctor1.id, doctor2.id, doctor3.id];
    const response = await client.get("/api/v1/doctor");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    response.body.forEach((doctor) => {
      expect(doctor.id).toBeDefined();
      expect(doctorIds).toContain(doctor.id);
      expect(doctor.name).toBeDefined();
      expect(doctor.phone).toBeDefined();
      expect(doctor.email).toBeDefined();
    });
  });

  it("get a doctor", async () => {
    const doctor = await doctorFactory.makeDoctor();
    const response = await client.get(`/api/v1/doctor/${doctor.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(doctor.id);
    expect(response.body.name).toBe(doctor.name);
    expect(response.body.phone).toBe(doctor.phone);
    expect(response.body.email).toBe(doctor.email);
  });

  it("fail to get a doctor with invalid id", async () => {
    const response = await client.get("/api/v1/doctor/invalid-id");

    expect(response.status).toBe(404);
  });

  it("update a doctor", async () => {
    const doctor = await doctorFactory.makeDoctor();
    const updatedDoctor = {
      name: faker.name.firstName(),
      phone: faker.phone.phoneNumber(),
      email: faker.internet.email(),
    };
    const response = await client.put(`/api/v1/doctor/${doctor.id}`).send(updatedDoctor);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(doctor.id);
    expect(response.body.name).toBe(updatedDoctor.name);
    expect(response.body.phone).toBe(updatedDoctor.phone);
    expect(response.body.email).toBe(updatedDoctor.email);
  });

  it("delete a doctor", async () => {
    const doctor = await doctorFactory.makeDoctor();
    const response = await client.delete(`/api/v1/doctor/${doctor.id}`);

    expect(response.status).toBe(204);
    const deletedDoctor = await Doctor.findOne({ _id: doctor.id });
    expect(deletedDoctor.deleted).toBe(true);
  });

  it("get a deleted doctor", async () => {
    const doctor = await doctorFactory.makeDoctor();
    await client.delete(`/api/v1/doctor/${doctor.id}`);
    const response = await client.get(`/api/v1/doctor/${doctor.id}`);

    expect(response.status).toBe(404);
  });
});
