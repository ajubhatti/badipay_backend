const db = require("../_helpers/db");
const shortid = require("shortid");

// router.get("/verify-email", async (req, res, next) => {
//   try {
//     const user = await User.findOne({ emailToken: req.query.token });
//     if (!user) {
//       req.flash("error", "Token is invalid, Please contact us for assistance");
//       return res.redirect("/");
//     }
//     user.emailToken = null;
//     user.isVerified = true;

//     const savedUser = await user.save().then((user) => {
//       //Create new referral for new user
//       const newReferrer = new Referral({
//         referralId: uuidv4(),
//         referralLink: uuidv4(),
//         userId: user._id,
//       });
//       //save referral to the database
//       newReferrer.save();

//       const customUserResponse = { user: savedUser };
//       customUserResponse.refCode = newReferrer.referralId;

//       req.login(user, async (err) => {
//         if (err) return next(err);
//         req.flash(
//           "success",
//           `Welcome to Jenerouszy Mechanism ${user.username}`
//         );
//         const redirectUrl = req.session.redirectTo || `/dashboard`;
//         delete req.session.redirectTo;
//         res.redirect(redirectUrl);
//       });
//     });
//   } catch (error) {
//     console.log(error);
//     req.flash(
//       "error",
//       "Something went wrong, please try again or contact us for assistance"
//     );
//     res.redirect("/");
//   }
// });

const generateReferralCode = async (userId) => {
  var userData = await db.Account.findById(userId);
  if (!userData.referrelCode) {
    var referalData = await db.Referral.findOne({ userId: userId });
    if (referalData) {
      referalData = referalData;
    } else {
      referalData = await saveReferralCodeOfUser(userId);
    }
    return referalData;
  }
};

const saveReferralCodeOfUser = async (userId) => {
  // let code = await referalcodeGenerator();
  let code = Math.floor(10000000 + Math.random() * 90000000);
  let paramsData = {
    referralCode: code,
    userId: userId,
  };

  const referal = new db.Referral(paramsData);
  await referal.save();
  return referal;
};

const referalcodeGenerator = async () => {
  shortid.characters(
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@"
  );
  return await shortid.generate();
};

module.exports = {
  generateReferralCode,
};
