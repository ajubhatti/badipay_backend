exports.userUpdateValidation = [
  // valid fields user might update (but is not required to update
  // we usseme user object is already created

  check("lastname", "lastname must contain 1-32 character(s)")
    .isLength({ min: 1, max: 32 })
    .trim()
    .escape()
    .optional(),
  check("firstname", "firstname must contain 1-32 character(s)")
    .isLength({ min: 1, max: 32 })
    .trim()
    .escape()
    .optional(),
  check("email")
    .isEmail()
    .normalizeEmail()
    .optional()
    .withMessage("Email is not valid"),
  check("username")
    .optional()
    .isLength({ min: 1 })
    .withMessage(
      "username must be from 1 to 30 alphanumeric characters/underscore. "
    )
    .isLength({ max: 30 })
    .withMessage("username cannot exceed 30 alphanumeric characters/undescore.")
    .matches(/^[A-Za-z0-9_]{1,30}$/)
    .withMessage(
      "username may contain only alphanumeric characters/undescore. No spaces allowed"
    ),
  check("password")
    .optional()
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must contain at least 8 alphanumeric characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number "),
];

exports.checkValidationResult = (req, res, next) => {
  console.log("in checkValidationResult w", JSON.stringify(req.body, null, 4));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(
      "failed checkValidationresult failed: w ",
      JSON.stringify(errors, null, 4)
    );
    const firstError = errors.array()[0].msg;
    console.log("failed checkValidationresult firstError=", firstError);
    return res.json({ status: false, error: firstError });
  }
  next();
};
