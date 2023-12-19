var express = require("express");
var path = require("path");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
const errorHandler = require("./_middleware/error-handler");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const apiRoutes = require("./routes");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/files", express.static("./public/files"));
app.use("/uploads", express.static("./uploads"));''

app.use(bodyParser.json());
app.use(helmet());

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

// api routes
app.use("/", apiRoutes);

// swagger docs route
app.use("/api-docs", require("./_helpers/swagger"));

// global error handler
app.use(errorHandler);

module.exports = app;
