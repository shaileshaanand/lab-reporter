const { faker } = require("@faker-js/faker");
const jwt = require("jsonwebtoken");

const { userFactory } = require("../../factories");
const { connectTestDb, disconnectTestDb, clearDb } = require("../../tests/helpers");

require("dotenv").config();

// const User = require("../User");

describe("User", () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(clearDb);

  it("should create a new user", async () => {
    const userData = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      username: faker.internet.userName(),
      password: faker.internet.password(),
    };
    const user = await userFactory.makeUser(userData);
    expect(user).toHaveProperty("_id");
    expect(user).toHaveProperty("firstName");
    expect(user).toHaveProperty("lastName");
    expect(user).toHaveProperty("username");
    expect(user).toHaveProperty("password");

    expect(user.firstName).toEqual(userData.firstName);
    expect(user.lastName).toEqual(userData.lastName);
    expect(user.username).toEqual(userData.username);
    expect(user.password).not.toEqual(userData.password);

    expect(user.password).toHaveLength(60);
    await expect(user.comparePassword(userData.password)).resolves.toBe(true);

    const token = await user.issueToken();
    expect(jwt.verify(token, process.env.JWT_SECRET)).toBeTruthy();
  });

  it("should not create a new user with existing username", async () => {
    const userData = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      username: faker.internet.userName(),
      password: faker.internet.password(),
    };
    await userFactory.makeUser(userData);
    await expect(userFactory.makeUser(userData)).rejects.toThrow();
  });

  it("should not hash password when updating", async () => {
    const userData = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      username: faker.internet.userName(),
      password: faker.internet.password(),
    };
    const user = await userFactory.makeUser(userData);
    const newData = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      password: faker.internet.password(),
    };

    user.firstName = newData.firstName;
    user.lastName = newData.lastName;
    await user.save();

    expect(user.firstName).toEqual(newData.firstName);
    expect(user.lastName).toEqual(newData.lastName);
    await expect(user.comparePassword(userData.password)).resolves.toBe(true);

    user.password = newData.password;
    await user.save();

    await expect(user.comparePassword(newData.password)).resolves.toBe(true);
  });
});
