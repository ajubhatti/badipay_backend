const bcrypt = require("bcryptjs");
const db = require("./db");
const Role = require("./role");

const createTestUser = async () => {
  // create test user if the db is empty
  if ((await db.User.countDocuments({})) === 0) {
    const user = new db.User({
      firstName: "Test",
      lastName: "User",
      username: "test",
      passwordHash: bcrypt.hashSync("test", 10),
      role: Role.Admin,
    });
    await user.save();
  }
};

module.exports = createTestUser;
