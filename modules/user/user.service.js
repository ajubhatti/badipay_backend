const db = require("../../_helpers/db");

const userById = async (req, res, next, id) => {
  console.log(">>in userById: ", id);
  await db.User.findById(id).exec((err, user) => {
    if (err) {
      return res.status(400).json({
        error: "System Error: User not found 45",
      });
    }
    if (!user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    req.profile = user;
    console.log("found ", user);
    next();
  });
};

const me = (req, res) => {
  if (req.headers && req.headers.authorization) {
    var authorization = req.headers.authorization.split(" ")[1],
      decoded;
    try {
      decoded = jwt.verify(authorization, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).send("unauthorized!!!!");
    }
    var userId = decoded.id;
    // Fetch the user by id
    db.User.findOne({ _id: userId }).then(function (user) {
      // Do something with the user
      return res.send(200);
    });
  }
  return res.status(400).json({ error: "System Error: User not found 73" });
};

const userFromJwtFull = (req) => {
  if (!(req.auth && req.auth._id)) {
    return res.json({
      status: false,
      error: "Access denied. Error 47",
    });
  }

  let id = req.auth._id;
  db.User.findById(id)
    .populate("accountId")
    .exec((err, user) => {
      if (err) {
        return res.status(400).json({
          error: "System Error: User not found 45",
        });
      }
      if (!user) {
        return res.status(400).json({
          error: "User not found",
        });
      }
      req.profile = user;
      console.log("found ", user);
      next();
    });
};

const userFromJwt = (req, res, next) => {
  console.log(">>in userFromJwt: w req.auth=", req.auth);

  if (!(req.auth && req.auth._id)) {
    return res.json({
      status: false,
      error: "Access denied. Error 47",
    });
  }
  let id = req.auth._id;
  db.User.findById(id).exec((err, user) => {
    if (err) {
      return res.status(400).json({
        error: "System Error: User not found 45",
      });
    }
    if (!user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    req.profile = user;
    console.log("found ", user);
    next();
  });
};

const userByIdPrivate = (req, res, next, id) => {
  console.log("in userByIdPrivate: ", id);
  db.User.findById(id)
    .populate("accountId") //  populate
    .exec((err, user) => {
      if (err) {
        return res.status(400).json({
          error: "System Error: User not found 45",
        });
      }
      if (!user) {
        return res.json({
          status: false,
          error: "User not found",
        });
      }
      req.profile = user;
      console.log("found ", user);
      next();
    });
};

const readUser = (req, res) => {
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json({ status: true, result: req.profile });
};

const updateUser = (req, res) => {
  console.log(">>>> in updateUser req.body=", req?.body);
  db.User.findOneAndUpdate(
    { _id: req.prodile._id },
    { $set: req.body },
    { new: true },
    (err, user) => {
      if (err) {
        let r = errorHandlerDetail(err);
        console.log(">>>r=", r);
        if (r.dupe) {
          let msg = r.value + " already exists. Please change and try again.";
          return res.json({ status: false, error: msg, field: r.field });
        } else {
          return res.status(400).json({
            error: "database update error",
          });
        }
      }
      user.hashed_password = undefined;
      user.salt = undefined;
      return res.json({ status: true, result: user });
    }
  );
};

const getUsersAll = (req, res) => {
  console.log(" getUsersAll  dump......");
  db.User.find().exec((err, result) => {
    console.log("exiting in getUsers err=", err);
    if (err) {
      return res.status(400).json({
        error: "System error searching for All Eventix ",
      });
    }
    res.json(result);
  });
};

module.exports = {
  userById,
  me,
  userFromJwtFull,
  userFromJwt,
  userByIdPrivate,
  readUser,
  updateUser,
  getUsersAll,
};
