const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema;
const { v4: uuidv4 } = require("uuid"); // upgraded format

const userAccountSchema = new Schema(
  {
    accountName: {
      type: String,
      trim: true,
      required: true,
      maxlength: 64,
    },
    accountEmail: {
      type: String,
      trim: true,
      maxlength: 64,
    },
    accountPhone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    accountUrl: {
      type: String,
      trim: true,
      maxlength: 127,
    },
    ticketPlan: {
      type: String,
      required: true,
      enum: [
        "tbd",
        "free",
        "paid",
        "basicPaidQuarter",
        "basicPaidAnnual",
        "comp",
        "auto",
        "upgrading",
        "wip",
      ],
      default: "tbd",
    },
    accountPaymentStatus: {
      type: String,
      enum: [
        "tbd",
        "good",
        "late30days",
        "late60days",
        "late90days",
        "terminated",
      ],
      default: "tbd",
    },
    primaryContactEmail: {
      type: String,
      trim: true,
      maxlength: 64,
    },
    accountNum: {
      type: Number,
      required: true,
      immutable: true,
      unique: true,
    },
    //        authorizedEventCreators:[ObjectId],
    //        authorizedEventDoormen:[ObjectId],
    primaryAdminUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      //            required: true
    },
    //        secondaryAdminUser:{
    //            type: Schema.Types.ObjectId,
    //            ref: 'User',
    //        },
    createUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      //      immutable: true,
      //     required: true                    MUST REMOVE FOR google signup accounts. do
    },
    updateUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  }
);

// the set of accounts (associated with one event) must each have a unique name.
// for each primaryAdmin
// i.e can't have two 'Theatre" accounts names by the same Admin.

// users can have only one account now. so this is not necessary and might cause gridlock
// if user create account then it fails to save in user.accountId and user re-creates
userAccountSchema.index(
  {
    accountNum: 1,
  },
  {
    unique: true,
  }
);

const generateRandomId = (n) => {
  // genrate randome number of fixed lenght exactly n. See
  //https://stackoverflow.com/questions/21816595/how-to-generate-a-random-number-of-fixed-length-using-javascript
  // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.

  let add = 1,
    max = 12 - add;
  if (n > max) {
    return generate(max) + generate(n - max);
  }
  max = Math.pow(10, n + add);
  let min = max / 10; // Math.pow(10, n) basically
  let number = Math.floor(Math.random() * (max - min + 1)) + min;
  return ("" + number).substring(add);
};

userAccountSchema.virtual("userId").set(function (userId) {
  if (this.isNew) {
    this.createUserId = userId;
    this.updateUserId = userId;
    this.primaryAdminUser = userId;
    let mynum = generateRandomId(11);
    this.accountNum = mynum;
  } else {
    this.updateUserId = userId;
  }
});

module.exports = mongoose.model("UserAccount", userAccountSchema);
