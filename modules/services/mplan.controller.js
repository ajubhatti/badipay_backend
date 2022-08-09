const mplanService = require("./mplan.service");
const express = require("express");
const router = express.Router();

const getMplan = (req, res, next) => {
  console.log("req---", req.body);
  mplanService
    .getMplanPlan(req.body)
    .then((service) => {
      res.json({ status: 200, data: service, message: "success" });
    })
    .catch(next);
};

router.post("/getMplan", getMplan);

module.exports = router;
