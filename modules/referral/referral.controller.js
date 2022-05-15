const express = require("express");
const router = express.Router();
const referralService = require("./referral.services");

const referalCode = (req, res, next) => {
  referralService
    .referalCode(req.params.id)
    .then((result) =>
      res.json({
        status: 200,
        data: result,
        message: "successfully generated",
      })
    )
    .catch(next);

  //   Referral.findOne({ userId: req.user._id })
  //     .populate("user") //Populate model with user
  //     .then((loggedUser) => {
  //       //Generate random referral link
  //       const generatedRefLink = `${req.protocol}://${req.headers.host}/register?reflink=${loggedUser.referralLink}/dashboard`;
  //       res.render("dashboard/referrals", {
  //         loggedUser: loggedUser,
  //         generatedRefLink: generatedRefLink,
  //       });
  //     });
};

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

router.get("/:id", referalCode);
router.post("/code", referalCodeGenerate);

module.exports = router;
