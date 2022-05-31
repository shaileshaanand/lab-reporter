const sanitize = (obj) => {
  if (obj._id) {
    obj.id = obj._id;
  }
  delete obj._id;
  delete obj.__v;
  "deleted" in obj && delete obj.deleted;
  for (const key in obj) {
    if (!["id", "$__"].includes(key) && typeof obj[key] === "object") {
      obj[key] = sanitize(obj[key]);
    }
  }
  return obj;
};

module.exports = { sanitize };
