const express = require("express");
const router = express.Router();
const referralService = require("../controller/referral.services");

const referalCodeGenerate = (req, res, next) => {
  referralService
    .generateReferralCode(req.body.userId)
    .then((result) => {
      res.json({
        status: 200,
        message: "successful,",
        data: result,
      });
    })
    .catch(next);
};

router.post("/code", referalCodeGenerate);

module.exports = router;
