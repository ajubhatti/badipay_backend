const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const validateRequest = require("../_middleware/validate-request");
const multer = require("multer");
const fs = require("fs");
const bannersService = require("../controller/banners.service");
const upload = require("../_middleware/uploadFiles");
const helpers = require("../_middleware/imageFilter");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/files");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const uploadBanner = (req, res, next) => {
  // var img = fs.readFileSync(req.file.path);
  // var encode_img = img.toString("base64");
  // var encodimg = Buffer.from(encode_img).toString("utf-8");
  // var final_img = {
  //   contentType: req.file.mimetype,
  //   image: encodimg,
  // };

  // if (
  //   req.file &&
  //   req.file.mimetype != "image/jpeg" &&
  //   req.file.mimetype != "image/png"
  // )
  //   return res.json({
  //     status: 1,
  //     message: "Please Choose JPG or PNG images",
  //   });
  // let image = "/uploads/" + req.file.filename;

  // var file = __dirname + "/" + req.file.originalname;
  // fs.readFile(req.file.path,  (err, data)=> {
  //   fs.writeFile(file, data,  (err)=> {
  //     if (err) {
  //       console.error(err);
  //       response = {
  //         message: "Sorry, file couldn't be uploaded.",
  //         filename: req.file.originalname,
  //       };
  //     } else {
  //       response = {
  //         message: "File uploaded successfully",
  //         filename: req.file.originalname,
  //       };
  //     }
  //     res.end(JSON.stringify(response));
  //   });
  // });

  // req.file.path;
  // let body = {
  //   fileName: req.body.fileName,
  //   description: req.body.description,
  //   img: req.file.path,
  // };

  // bannersService
  //   .create(body)
  //   .then((banner) => res.json(banner))
  //   .catch(next);

  bannersService
    .addImage(req, res)
    .then((banner) => {
      res.json({ status: 200, data: banner, message: "success" });
    })
    .catch(next);
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
  let uploadFile = multer({
    storage: storage,
    fileFilter: helpers.imageFilter,
  }).single("profile_pic");

  uploadFile(req, res, (err) => {
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
router.post("/uploadBanner", upload.single("file"), uploadBanner);
router.post("/upload-profile-pic", profileUpload);

module.exports = router;
