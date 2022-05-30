const Joi = require("joi");
const express = require("express");
const router = express.Router();
const authorize = require("../../_middleware/authorize");
const validateRequest = require("../../_middleware/validate-request");
const multer = require("multer");
const fs = require("fs");
const db = require("../../_helpers/db");
const bannersService = require("./banner.service");
// const upload = require("../../_middleware/upload");
const helpers = require("../../_middleware/imageFilter");
var path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    // cb(null, Date.now() + file.originalname);
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });

const uploadBanner = (req, res, next) => {
  console.log("req.file", req.file);
  bannersService
    .addImage(req, res)
    .then((banner) => {
      res.json({ status: 200, data: banner, message: "success" });
    })
    .catch(next);

  // res.status(200).send({ filePath: req.file.path, message: "uploaded" });
};

const create = (req, res, next) => {
  bannersService
    .create(req.body)
    .then((banner) =>
      res.json({ status: 200, data: banner, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  bannersService
    .getById(req.params.id)
    .then((banner) =>
      res.json({ status: 200, data: banner, message: "success" })
    )
    .catch(next);
};

const updateSchema = (req, res, next) => {
  const schemaRules = {
    bankName: Joi.string().required().empty(""),
    bankDetail: Joi.string().empty(""),
    bankBranch: Joi.string().empty(""),
  };
  validateRequest(req, next, schemaRules);
};

const update = (req, res, next) => {
  bannersService
    .update(req.params.id, req.body)
    .then((banner) =>
      res.json({ status: 200, data: banner, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  bannersService
    .delete(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "Banner deleted successfully",
      })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  bannersService
    .getAll()
    .then((banner) =>
      res.json({ status: 200, data: banner, message: "success" })
    )
    .catch(next);
};

const profileUpload = (req, res, next) => {
  // 'profile_pic' is the name of our file input field in the HTML form
  let upload = multer({
    storage: storage,
    fileFilter: helpers.imageFilter,
  }).single("profile_pic");

  upload(req, res, (err) => {
    // req.file contains information of uploaded file
    // req.body contains information of text fields, if there were any

    if (req.fileValidationError) {
      return res.send({
        status: 400,
        data: [],
        message: req.fileValidationError,
      });
    } else if (!req.file) {
      return res.send({
        status: 400,
        data: [],
        message: "Please select an image to upload",
      });
    } else if (err instanceof multer.MulterError) {
      return res.send({
        status: 400,
        data: [],
        message: err,
      });
    } else if (err) {
      return res.send({
        status: 400,
        data: [],
        message: err,
      });
    }

    // Display uploaded image for user validation
    res.send({
      status: 200,
      data: `You have uploaded this image: <hr/><img src="${req.file.path}" width="500"><hr /><a href="./">Upload another image</a>`,
      message: `You have uploaded this image: <hr/><img src="${req.file.path}" width="500"><hr /><a href="./">Upload another image</a>`,
    });
  });
};

router.get("/:folder/:id", async (req, res) => {
  let filepath = path.join(
    __dirname + `/../images/${req.params.folder}/${req.params.id}.png`
  );
  res.sendFile(filepath);
});

router.post("/:folder/:id", upload.single("file"), async (req, res) => {
  try {
    let image = req.files.image;

    if (!image)
      return res
        .status(400)
        .send({ status: 400, data: [], message: "Image not provided!" });

    const imageUrl = await upload(image, req.params.folder, req.params.id);

    if (imageUrl)
      res
        .status(201)
        .send({ status: 201, message: "Image uploaded", data: imageUrl });
  } catch (e) {
    res.status(400).send({
      message: "Error uploading image!",
      error: e.toString(),
      req: req.body,
    });
  }
});

router.delete("/:folder/:id", async (req, res) => {
  try {
    fs.unlinkSync(`images/${req.params.folder}/${req.params.id}.png`);

    res.status(201).send({ status: 200, data: [], message: "Image deleted" });
  } catch (e) {
    res.status(400).send({
      message: "Error deleting image!",
      error: e.toString(),
      req: req.body,
    });
  }
});

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", _delete);
router.post("/uploadBanner", upload.single("images"), uploadBanner);
router.post("/upload-profile-pic", profileUpload);

// Single file
router.post("/upload/single", upload.single("file"), (req, res) => {
  console.log(req.file);
  return res.send("Single file");
});

//Multiple files
router.post("/upload/multiple", upload.array("file", 10), (req, res) => {
  console.log(req.files);
  return res.send("Multiple files");
});

router.post("/uploadFile", upload.single("myFile"), uploadBanner);

module.exports = router;
