const { faker } = require("@faker-js/faker");
const jwt = require("jsonwebtoken");
const supertest = require("supertest");

const app = require("../app");
const { userFactory } = require("../factories");

require("dotenv").config();

const client = supertest(app);
const { connectTestDb, disconnectTestDb, clearDb } = require("./helpers");

describe("Authentication", () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);

  beforeEach(clearDb);

  it("should login a user", async () => {
    const password = faker.internet.password();
    const user = await userFactory.makeUser({ password });

    await expect(user.comparePassword(password)).resolves.toBe(true);

    const response = await client.post("/api/v1/auth/login").send({ username: user.username, password });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(jwt.verify(response.body.token, process.env.JWT_SECRET)).toBeTruthy();
    expect(response.body.user.id).toBe(user.id);
  });

  it("should not login a user with invalid password", async () => {
    const password = faker.internet.password();
    const user = await userFactory.makeUser();
    const response = await client.post("/api/v1/auth/login").send({ username: user.username, password });
    expect(response.status).toBe(401);
  });

  it("should not login a user with invalid username", async () => {
    await userFactory.makeUser();
    const response = await client
      .post("/api/v1/auth/login")
      .send({ username: faker.internet.userName(), password: faker.internet.password() });
    expect(response.status).toBe(404);
  });
});
