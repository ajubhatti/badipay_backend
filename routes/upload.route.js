const upload = require("../_middleware/uploadFiles");
const express = require("express");
const router = express.Router();
const os = require("os");

const create = async (req, res) => {
  try {
    const proxyHost = req.headers["x-forwarded-host"];
    const host = proxyHost ? proxyHost : req.headers.host;

    const origin = req.headers.origin;
    const hostName = os.hostname();

    if (req.file === undefined)
      return res.status(400).send({
        status: 400,
        data: "",
        message: "you must select a file.",
      });
    var url = req.protocol + "://" + req.get("host");
    if (req.get("host") !== "localhost:4000") {
      url = "https://api.badipay.co.in";
    }
    // const imgUrl = `http://${host}/files/${req.file.filename}`;

    const imgUrl = `${url}/files/${req.file.filename}`;

    return res
      .status(200)
      .send({ status: 200, data: imgUrl, message: "success" });
  } catch (err) {
    return res.status(400).send({ status: 400, data: err, message: "fail" });
  }
};

// use for upload files on node server
router.post("/upload", upload.single("file"), create);

router.post("/upload/multiple", upload.array("file", 10));

module.exports = router;
