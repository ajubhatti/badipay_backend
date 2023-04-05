const { errorRes } = require("./response");

function notFound(req, res, _) {
  return errorRes(res, "no routes", "you are lost.", 404);
}

function onlyAdmin(req, res, next) {
  if (req.user.type === "admin") return next();
  return invalidToken(req, res);
}

function notOnlyMember(req, res, next) {
  if (req.user.type === "member") return invalidToken(req, res);
  return next();
}

function invalidToken(req, res) {
  const errMsg = "INVALID TOKEN";
  const userText = JSON.stringify(req.user);
  const err = `${errMsg} ERROR - user: ${userText}, IP: ${req.ip}`;
  return errorRes(res, err, errMsg, 401);
}

function roundOfNumber(num) {
  let decimalPlaces = 2;
  if (!Number.isNaN(num)) {
    num = Math.round(num + "e" + decimalPlaces);
    return Number(num + "e" + -decimalPlaces);
  }
}

module.exports = { notFound, onlyAdmin, notOnlyMember, roundOfNumber };
