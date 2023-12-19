const expressJwt = require("express-jwt"); // for authorization check

const requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: "auth",
  algorithms: ["HS256"],
});

const isAuth = (req, res, next) => {
  // this should return 401 Unauthorizederror

  let user = req.profile && req.auth && req.profile._id == req.auth._id;

  if (!user) {
    return res.json({ status: false, error: "Access denied" });
  }

  next();
};

module.exports = {
  requireSignin,
  isAuth,
};
