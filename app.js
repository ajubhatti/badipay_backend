var express = require("express");
var path = require("path");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
require("dotenv").config();
const errorHandler = require("./_middleware/error-handler");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");

const indexRouter = require("./routes/index");
const usersRouter = require("./modules/user/user.controller");
const accountRouter = require("./modules/accounts/accounts.controller");
const servicesRouter = require("./modules/services/services.controller");
const walletRouter = require("./modules/wallet/wallet.controller");
const walletTransaction = require("./modules/walletTransaction/walletTransaction.controller");
const bankRouter = require("./modules/banks/banks.controller");
const bankAccountRouter = require("./modules/bankAccounts/bankAccounts.controller");
const bannerRouter = require("./modules/banners/banners.controller");
const tickerRouter = require("./modules/ticker/ticker.controller");
const referralRouter = require("./modules/referral/referral.controller");
const contactUsRouter = require("./modules/contactUs/contactUs.controller");
const supportsRouter = require("./modules/supports/support.controller");
const subSupportRouter = require("./modules/subSupports/subSupport.controller");
const myBannerRouter = require("./modules/banner/banner.controller");
const stateRouter = require("./modules/state/states.controller");
const ambikaSlabRouter = require("./modules/services/ambikaSlab.controller");
const mlanRouter = require("./modules/services/mplan.controller");
const companyRouter = require("./modules/company/company.controller");
const apisRouter = require("./modules/services/apis.controller");
const rechargeRouter = require("./modules/recharge/recharge.controller");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(express.static(__dirname + "/public"));
app.use(express.static(`${__dirname}/public`));
// app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

app.use(bodyParser.json());
app.use(helmet());

// app.use((req, res, next)=> {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
//   });

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

var corsOption = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  exposedHeaders: ["x-auth-token"],
};
// app.use(cors(corsOption));
app.use(cors({ origin: true }));
app.options("*", cors());

app.use(mongoSanitize());

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/auth", accountRouter);
app.use("/service", servicesRouter);
app.use("/ambikaSlab", ambikaSlabRouter);
app.use("/wallet", walletRouter);
app.use("/walletTransaction", walletTransaction);
app.use("/bank", bankRouter);
app.use("/bankAccount", bankAccountRouter);
app.use("/banner", bannerRouter);
app.use("/ticker", tickerRouter);
app.use("/referral", referralRouter);
app.use("/contactUs", contactUsRouter);
app.use("/support", supportsRouter);
app.use("/subSupport", subSupportRouter);
app.use("/mlan", mlanRouter);
app.use("/company", companyRouter);
app.use("/myBanner", myBannerRouter);
app.use("/state", stateRouter);
app.use("/apis", apisRouter);
app.use("/rechargeOrBill", rechargeRouter);

// swagger docs route
app.use("/api-docs", require("./_helpers/swagger"));

// global error handler
app.use(errorHandler);

// start server
const port =
  process.env.NODE_ENV === "production" ? process.env.PORT || 80 : 4000;

let SERVER_RETRIES = 0;

const listenWithRetries = () => {
  return app
    .listen(port, () => {
      console.log(`Server is running on port ${port}`);
    })
    .on("error", (err) => {
      // little trick to retry connection  every 2^n secords. i.e.  2,4,8, 16, 32, 64 ...
      SERVER_RETRIES++;
      let retrytime = Math.pow(2, SERVER_RETRIES) * 1000;
      console.error(
        `***Server failed to connect on port ${port}` +
          ". Retrying in " +
          retrytime / 1000 +
          " sec.",
        err.stack
      );
      setTimeout(listenWithRetries, retrytime);
    });
};

listenWithRetries();

module.exports = app;
