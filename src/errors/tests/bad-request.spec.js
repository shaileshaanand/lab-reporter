const BadRequestError = require("../bad-request");

describe("BadRequestError", () => {
  it("bad request", () => {
    const error = new BadRequestError("Bad request");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Bad request");
  });
});
