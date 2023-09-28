const mongoose = require("mongoose");
const crypto = require("crypto");
//const uuidv1 = require("uuid/v1");
const { v1: uuidv1 } = require("uuid"); // upgraded format
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema(
  {
    name: {
      // remove
      type: String,
      trim: true,
      maxlength: 32,
    },
    firstname: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    lastname: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    orginalEmailOrMobilePhone: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      //         immutable:true,
    },
    isEmail: {
      // boolen True if user signed up with Phone, T assumes email
      type: Boolean,
      trim: true,
      required: true,
      //            immutable:true,
    },
    email: {
      type: String,
      trim: true,
      //           required: true,
      //           immutable:true,
      unique: true,
      sparce: true,
    },
    mobilePhone: {
      type: String,
      trim: true,
      //            unique: true,
      sparce: true,
    },
    username: {
      type: String,
      trim: true,
      unique: true,
      sparce: true,
    },
    confirmationCode: {
      // for email or phone verification upon signup or reset. should timeout
      type: Number,
    },
    confirmationCodeExpires: {
      type: Date,
    },
    confirmationCodeCounter: {
      // count how many times verication token has been reset
      type: Number,
      default: 1,
    },
    isVerified: {
      // for email verification upon signup. should timeout
      type: Boolean,
      required: true,
      default: false,
    },
    vendorIntent: {
      // does user intend to become a vendor ?
      type: Boolean,
    },
    sendgrid_statusCode1: {
      // verification email sendgrid statusCode if error see sendMail comments. This is a paper trail of error is client didn't get verificiton email
      type: Number,
    },
    passwordToken: {
      type: String,
      trim: true,
    },
    resetPasswordExpires: {
      type: Date,
    },
    hashed_password: {
      type: String,
    },
    about: {
      type: String,
      trim: true,
    },
    salt: String,
    role: {
      type: Number,
      default: 0, // 0= user, 1 = promoter admin, 2 = superuser;
    }, // if  role=1 then MUST have an account (i.e promoter) object
    // we manually set role=2 for superuser accounts, which can access api/kitchensink100
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },
  },
  { timestamps: true, versionKey: false }
);

userSchema.virtual("emailOrMobilePhone").set(function (emailOrPhone) {
  console.log(">>>>>>>>>>>emailOrMobilePhone>>>>>>this >>>>>>>>>>", this);
  if (this.isNew) {
    this.orginalEmailOrMobilePhone = emailOrPhone;
  }
});

userSchema
  .virtual("password")
  .set(function (password) {
    this._password = password;
    this.salt = uuidv1();
    this.hashed_password = this.encryptPassword(password);

    //       this.authToken = this.setAuthentication(password);    // no auth token
  })
  .get(function () {
    return this._password;
  });

const encryptPasswordFunc = (password, salt) => {
  console.log("*****in encryptPasswordFunc w password,salt=", password, salt);
  if (!password) return "";
  try {
    return crypto.createHmac("sha1", salt).update(password).digest("hex");
  } catch (err) {
    console.log("******in encryptPasswordFunc ERR");
    return "";
  }
};

// before save user MUST always use updateOne when updating password
userSchema.pre("updateOne", function (next) {
  console.log("***in preupdateOne hook");
  const newpassword = this.getUpdate().$set.newpassword;
  if (!newpassword) {
    console.log("****exiting preupdateOne hook ASAP");
    return next();
  }
  let salt = this.getUpdate().$set.salt;

  if (!salt) {
    salt = uuidv1();
    ///this.getUpdate().$set.salt = salt;
    this.set({ salt: salt }); ////  -- better way?
  }
  try {
    console.log("virtually setting newpassword..");
    const hashed_password = encryptPasswordFunc(newpassword, salt);
    ///this.getUpdate().$set.hashed_password = hashed_password;
    this.set({ hashed_password: hashed_password }); ///    --better way?
    console.log(
      "done: newpassword, hashed_password, salt=",
      newpassword,
      hashed_password,
      salt
    );
    next();
  } catch (err) {
    console.log("userSchema presave err");
    return next(err);
  }
});

//
//userSchema
//    .virtual("newpassword")
//    .set(function(newpassword) {
//        console.log ("virtually setting newpassword..");
//        if (!this.salt){
//            this.salt = uuidv1();
//        };
//        this.hashed_password = this.encryptPassword(newpassword);
//    });

/// token to reset authToken so user can request a new verification email
//userSchema
//    .virtual("authTokenTrigger")
//    .set(function(resetAuthToken) {
//        let seed2 = Math.random();
//        this.authToken = this.setAuthentication(seed2);
//        this.authTokenCounter+=1;
//    });

userSchema.methods = {
  authenticate: function (plainText) {
    // plainText is password from user
    return this.encryptPassword(plainText) === this.hashed_password;
  },
  encryptPassword: function (password) {
    if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },
  setAuthentication: function (email) {
    if (!email) return "";
    try {
      let seed = crypto.randomBytes(20); // random number authe
      let _authtoken = crypto
        .createHash("sha1")
        .update(seed + email)
        .digest("hex");
      return _authtoken;
    } catch (err) {
      return "";
    }
  },
};

const User = mongoose.model("User", userSchema);

module.exports = User;
