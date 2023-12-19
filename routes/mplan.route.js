const mplanService = require("../controller/mplan.service");
const express = require("express");
const router = express.Router();

const getMplan = (req, res, next) => {
  mplanService
    .getMplanPlan(req.body)
    .then((service) => {
      res.json({ status: 200, data: service, message: "success" });
    })
    .catch(next);
};

router.post("/getMplan", getMplan);

module.exports = router;
