const { faker } = require("@faker-js/faker");
const { StatusCodes } = require("http-status-codes");
const supertest = require("supertest");

const app = require("../app");
const { templateFactory, userFactory } = require("../factories");
const { Template } = require("../models");

require("dotenv").config();

const client = supertest(app);
const { connectTestDb, disconnectTestDb, clearDb } = require("./helpers");

let token;

describe("Template", () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    clearDb();
    const user = await userFactory.makeUser();
    token = `Bearer ${user.issueToken()}`;
  }, 10000);

  it("create a new Template", async () => {
    const template = {
      name: faker.name.firstName(),
      content: faker.lorem.paragraph(),
    };

    const response = await client.post("/api/v1/template").set("Authorization", token).send(template);

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.id).toBeDefined();
    const createdTemplate = await Template.findOne({ _id: response.body.id });
    expect(createdTemplate.name).toBe(template.name);
    expect(createdTemplate.content).toBe(template.content);
    expect(createdTemplate.deleted).toBe(false);
  });

  it("should not create template with invalid name", async () => {
    const template = {
      name: "a",
      content: faker.lorem.paragraph(),
    };
    const response = await client.post("/api/v1/template").set("Authorization", token).send(template);
    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect((await Template.find({})).length).toBe(0);
  });

  it("list all templates", async () => {
    const templates = await Promise.all(
      [...Array(3)].map(async () => {
        const template = await templateFactory.makeTemplate();
        return template;
      }),
    );

    const response = await client.get("/api/v1/template").set("Authorization", token);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.length).toBe(templates.length);
    templates.forEach((template) => {
      const templateObject = response.body.find((t) => t.id === template.id);
      expect(templateObject).toBeDefined();
      expect(templateObject.name).toBe(template.name);
      expect(templateObject.content).toBe(template.content);
      expect(templateObject.deleted).toBeUndefined();
    });
  });

  it("should not list templates if user is not logged in", async () => {
    const response = await client.get("/api/v1/template");
    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it("get a template", async () => {
    const template = await templateFactory.makeTemplate();
    const response = await client.get(`/api/v1/template/${template.id}`).set("Authorization", token);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.id).toBe(template.id);
    expect(response.body.name).toBe(template.name);
    expect(response.body.content).toBe(template.content);
    expect(response.body.deleted).toBeUndefined();
  });

  it("Update a template", async () => {
    const template = await templateFactory.makeTemplate();
    const updatedTemplate = {
      name: faker.name.firstName(),
      content: faker.lorem.paragraph(),
    };
    const response = await client
      .put(`/api/v1/template/${template.id}`)
      .set("Authorization", token)
      .send(updatedTemplate);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.id).toBe(template.id);
    expect(response.body.name).toBe(updatedTemplate.name);
    expect(response.body.content).toBe(updatedTemplate.content);
    expect(response.body.deleted).toBeUndefined();
  });

  it("should not update template with invalid name", async () => {
    const template = await templateFactory.makeTemplate();
    const updatedTemplate = {
      name: "a",
      content: faker.lorem.paragraph(),
    };
    const response = await client
      .put(`/api/v1/template/${template.id}`)
      .set("Authorization", token)
      .send(updatedTemplate);
    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    expect((await Template.find({})).length).toBe(1);
  });

  it("should not get template if user is not logged in", async () => {
    const template = await templateFactory.makeTemplate();
    const response = await client.get(`/api/v1/template/${template.id}`);
    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it("should not get template if template does not exist", async () => {
    const response = await client.get(`/api/v1/template/${faker.datatype.uuid()}`).set("Authorization", token);
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });

  it("should not update template if user is not logged in", async () => {
    const template = await templateFactory.makeTemplate();
    const updatedTemplate = {
      name: faker.name.firstName(),
      content: faker.lorem.paragraph(),
    };
    const response = await client.put(`/api/v1/template/${template.id}`).send(updatedTemplate);
    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it("should not update template if template does not exist", async () => {
    const updatedTemplate = {
      name: faker.name.firstName(),
      content: faker.lorem.paragraph(),
    };
    const response = await client
      .put(`/api/v1/template/${faker.datatype.uuid()}`)
      .set("Authorization", token)
      .send(updatedTemplate);
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });

  it("should not delete template if user is not logged in", async () => {
    const template = await templateFactory.makeTemplate();
    const response = await client.delete(`/api/v1/template/${template.id}`);
    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it("should not delete template if template does not exist", async () => {
    const response = await client.delete(`/api/v1/template/${faker.datatype.uuid()}`).set("Authorization", token);
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });

  it("should delete template", async () => {
    const template = await templateFactory.makeTemplate();
    const response = await client.delete(`/api/v1/template/${template.id}`).set("Authorization", token);
    expect(response.status).toBe(StatusCodes.NO_CONTENT);
    const deletedTemplate = await Template.findById(template.id);
    expect(deletedTemplate).toBeDefined();
    expect(deletedTemplate.deleted).toBeTruthy();
  });

  it("should not get deleted template", async () => {
    const template = await templateFactory.makeTemplate();
    await client.delete(`/api/v1/template/${template.id}`).set("Authorization", token);
    const response = await client.get(`/api/v1/template/${template.id}`).set("Authorization", token);
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });
});
