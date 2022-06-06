const supertest = require("supertest");

const app = require("../app");
const { userFactory } = require("../factories");

require("dotenv").config();

const client = supertest(app);
const { connectTestDb, disconnectTestDb, clearDb } = require("./helpers");

describe("User API", () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(clearDb);

  it("should get logged in user", async () => {
    const user = await userFactory.makeUser();
    const response = await client.get("/api/v1/user/me").set("Authorization", `Bearer ${user.issueToken()}`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(user.id);
    expect(response.body.firstName).toBe(user.firstName);
    expect(response.body.lastName).toBe(user.lastName);
    expect(response.body.username).toBe(user.username);
    expect(response.body.password).toBeUndefined();
  });

  it("should not get logged in user if not logged in", async () => {
    const response = await client.get("/api/v1/user/me");
    expect(response.status).toBe(401);
  });

  it("should not get logged in user if ivalid jwt", async () => {
    const response = await client.get("/api/v1/user/me").set("Authorization", "Bearer eyksedhkjsdh");
    expect(response.status).toBe(401);
  });

  it("should not get logged in user if user deleted", async () => {
    const user = await userFactory.makeUser();
    const jwt = user.issueToken();
    await user.remove();
    const response = await client.get("/api/v1/user/me").set("Authorization", `Bearer ${jwt}`);
    expect(response.status).toBe(401);
  });
});
