module.exports = {
  // new changes
  saltRounds: Math.floor(Math.random() * 10),
  jwtSecretSalt: [...Array(9)]
    .map(() => Math.random().toString(36)[2])
    .join(""),
  devMongoUrl: "mongodb://localhost/kane",
  prodMongoUrl: "mongodb://localhost/kane",
  testMongoUrl: "mongodb://localhost/test",
  // new changes

  // old json
  connectionString: "mongodb://localhost/node-mongo-signup-verification",
  connectionString1:
    "mongodb+srv://ajubhatti:gj11nn5099@cluster0.rbuwj.mongodb.net/node-mongo-signup-verification?retryWrites=true&w=majority",
  secret:
    "THIS IS USED TO SIGN AND VERIFY JWT TOKENS, REPLACE IT WITH YOUR OWN SECRET, IT CAN BE ANY STRING",
  emailFrom: "multaniazaz@gmail.com",
  smtpOptions3: {
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "amara.gusikowski20@ethereal.email",
      pass: "q6qCBJuhuQDsNemFKg",
    },
  },
  smtpOptions2: {
    host: "smtp.gmail.com",
    service: "Gmail",
    secureConnection: true,
    port: 465,
    secure: true,
    auth: {
      user: "multaniazaz@gmail.com",
      pass: "gj11nn5099",
    },
  },
  smtpOptions: {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "multaniazaz@gmail.com",
      pass: "gj11nn5099",
    },
  },
};
