require("dotenv").config();
const app = require("./express");

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
