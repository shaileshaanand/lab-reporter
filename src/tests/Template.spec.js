const { faker } = require("@faker-js/faker");
const { StatusCodes } = require("http-status-codes");
const supertest = require("supertest");

const app = require("../app");
const { templateFactory, userFactory, usgReportFactory } = require("../factories");
const { randomFileId } = require("../factories/helpers");
const googleDrive = require("../helpers/googleDrive");
const { Template } = require("../models");

require("dotenv").config();

const client = supertest(app);
const { connectTestDb, disconnectTestDb, clearDb } = require("./helpers");

let token;

jest.mock("../helpers/googleDrive");

describe("Template", () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(async () => {
    clearDb();
    const user = await userFactory.makeUser();
    token = `Bearer ${user.issueToken()}`;
    jest.resetAllMocks();
  }, 10000);

  it("create a new Template from blank", async () => {
    const template = {
      name: faker.name.firstName(),
    };

    const driveFileId = randomFileId();
    googleDrive.createBlankDocument.mockResolvedValue(driveFileId);

    const response = await client.post("/api/v1/template").set("Authorization", token).send(template);

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.id).toBeDefined();
    const createdTemplate = await Template.findOne({ _id: response.body.id }).lean();
    expect(createdTemplate.name).toBe(template.name);
    expect(createdTemplate.content).toBe(template.content);
    expect(createdTemplate.driveFileId).toBe(driveFileId);
    expect(createdTemplate.deleted).toBe(false);
    expect(googleDrive.createBlankDocument).toHaveBeenCalledTimes(1);
    expect(googleDrive.createBlankDocument).toHaveBeenCalledWith(
      template.name,
      expect.anything(),
      process.env.GOOGLE_DRIVE_TEMPLATES_FOLDER_ID,
    );
  });

  it("create a new Template from another template", async () => {
    const existingTemplate = await templateFactory.makeTemplate();
    const template = {
      name: faker.name.firstName(),
      template: existingTemplate.id,
    };

    const driveFileId = randomFileId();
    googleDrive.cloneDocument.mockResolvedValue(driveFileId);

    const response = await client.post("/api/v1/template").set("Authorization", token).send(template);

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.id).toBeDefined();
    const createdTemplate = await Template.findOne({ _id: response.body.id }).lean();
    expect(createdTemplate.name).toBe(template.name);
    expect(createdTemplate.driveFileId).toBe(driveFileId);
    expect(createdTemplate.deleted).toBe(false);
    expect(googleDrive.cloneDocument).toHaveBeenCalledTimes(1);
    expect(googleDrive.cloneDocument).toHaveBeenCalledWith(
      existingTemplate.driveFileId,
      template.name,
      expect.anything(),
      process.env.GOOGLE_DRIVE_TEMPLATES_FOLDER_ID,
    );
  });

  it("create a new Template from USGReport", async () => {
    const usgReport = await usgReportFactory.makeUSGReport();
    const template = {
      name: faker.name.firstName(),
      template: usgReport.id,
    };

    const driveFileId = randomFileId();
    googleDrive.cloneDocument.mockResolvedValue(driveFileId);

    const response = await client.post("/api/v1/template").set("Authorization", token).send(template);

    expect(response.status).toBe(StatusCodes.CREATED);
    expect(response.body.id).toBeDefined();
    const createdTemplate = await Template.findOne({ _id: response.body.id }).lean();
    expect(createdTemplate.name).toBe(template.name);
    expect(createdTemplate.driveFileId).toBe(driveFileId);
    expect(createdTemplate.deleted).toBe(false);
    expect(googleDrive.cloneDocument).toHaveBeenCalledTimes(1);
    expect(googleDrive.cloneDocument).toHaveBeenCalledWith(
      usgReport.driveFileId,
      template.name,
      expect.anything(),
      process.env.GOOGLE_DRIVE_TEMPLATES_FOLDER_ID,
    );
  });

  it("should not create template with invalid name", async () => {
    const template = {
      name: "a",
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
    expect(response.body.driveFileId).toBe(template.driveFileId);
    expect(response.body.deleted).toBeUndefined();
  });

  it("Update a template", async () => {
    const template = await templateFactory.makeTemplate();
    const updatedTemplate = {
      name: faker.name.firstName(),
    };
    const response = await client
      .put(`/api/v1/template/${template.id}`)
      .set("Authorization", token)
      .send(updatedTemplate);
    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.id).toBe(template.id);
    expect(response.body.name).toBe(updatedTemplate.name);
    expect(response.body.deleted).toBeUndefined();
  });

  it("should not update template's template", async () => {
    const template = await templateFactory.makeTemplate();
    const updatedTemplate = {
      template: randomFileId(),
    };
    const response = await client
      .put(`/api/v1/template/${template.id}`)
      .set("Authorization", token)
      .send(updatedTemplate);
    expect(response.status).toBe(StatusCodes.BAD_REQUEST);
  });

  it("should not update template with invalid name", async () => {
    const template = await templateFactory.makeTemplate();
    const updatedTemplate = {
      name: "a",
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
    };
    const response = await client.put(`/api/v1/template/${template.id}`).send(updatedTemplate);
    expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it("should not update template if template does not exist", async () => {
    const updatedTemplate = {
      name: faker.name.firstName(),
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
    expect(googleDrive.moveDocument).toHaveBeenCalledTimes(1);
    expect(googleDrive.moveDocument).toHaveBeenCalledWith(
      template.driveFileId,
      process.env.GOOGLE_DRIVE_TEMPLATES_FOLDER_ID,
      process.env.GOOGLE_DRIVE_DELETED_TEMPLATES_FOLDER_ID,
      expect.anything(),
    );
  });

  it("should not get deleted template", async () => {
    const template = await templateFactory.makeTemplate();
    await client.delete(`/api/v1/template/${template.id}`).set("Authorization", token);
    const response = await client.get(`/api/v1/template/${template.id}`).set("Authorization", token);
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });
});
