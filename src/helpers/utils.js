const sanitize = (obj) => {
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  "deleted" in obj && delete obj.deleted;
  return obj;
};

module.exports = { sanitize };
