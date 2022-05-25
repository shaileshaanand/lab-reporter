const UnauthenticatedError = require("../unauthenticated");

describe("UnauthenticatedError", () => {
  it("unauthenticated", () => {
    const error = new UnauthenticatedError("Unauthenticated");
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Unauthenticated");
  });
});
