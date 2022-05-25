/* eslint-disable no-undef */
print("Start #################################################################");

db = db.getSiblingDB("lab_reporter_dev");
db.createUser({
  user: "lab_reporter",
  pwd: "lab_reporter1234",
  roles: [{ role: "readWrite", db: "lab_reporter_dev" }],
});
db.createCollection("users");

db = db.getSiblingDB("lab_reporter_test");
db.createUser({
  user: "lab_reporter",
  pwd: "lab_reporter1234",
  roles: [{ role: "readWrite", db: "lab_reporter_test" }],
});
db.createCollection("users");

print("END #################################################################");
