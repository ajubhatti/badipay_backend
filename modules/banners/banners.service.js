const db = require("../../_helpers/db");
var upload = require("./upload");
const fs = require("fs");
var path = require("path");

module.exports = {
  create,
  update,
  getById,
  getAll,
  delete: _delete,
  getImage,
  addImage,
  addImage2,
};

async function getImage(params) {
  await db.Banners.find({}, { sort: { _id: -1 } }, function (err, photos) {
    res.render("index", {
      title: "NodeJS file upload tutorial",
      msg: req.query.msg,
      photolist: photos,
    });
  });
}

async function addImage2(req, res) {
  var img = fs.readFileSync(req.file.path);
  var encode_img = img.toString("base64");
  var obj = {
    fileName: req.body.fileName,
    description: req.body.description,
    path: path.join("/uploads/" + req.file.filename),
    img: {
      data: new Buffer(encode_img, "base64"),
      contentType: req.file.mimetype,
    },
  };

  const banner = new db.Banners(obj);
  await banner.save();
  return banner;
}

async function addImage(req, res) {
  const filePath = path.join(__dirname, "/uploads");
  const dirName = process.cwd();
  var obj = {
    fileName: req.body.name,
    description: req.body.desc,
    path: path.join("/uploads/" + req.file.filename),
    img: {
      data: fs.readFileSync(
        path.join(dirName + "/uploads/" + req.file.filename)
      ),
      contentType: "image/png",
    },
  };

  const banner = new db.Banners(obj);
  await banner.save();
  return banner;
}

async function create(params) {
  const banner = new db.Banners(params);
  await banner.save();
  return banner;
}

async function update(id, params) {
  const banner = await getBanner(id);

  if (
    params.name &&
    banner.bankName !== params.name &&
    (await db.Banners.findOne({ bankName: params.name }))
  ) {
    throw `Name ${params.name} is already taken`;
  }

  Object.assign(banner, params);
  banner.updated = Date.now();
  await banner.save();

  return banner;
}

async function getById(id) {
  const banner = await getBanner(id);
  return banner;
}

async function getAll() {
  const banner = await db.Banners.find();
  return banner;
}

async function _delete(id) {
  const banner = await getBanner(id);
  await banner.remove();
}

async function getBanner(id) {
  if (!db.isValidId(id)) throw "Banner not found";
  const banner = await db.Banners.findById(id);
  if (!banner) throw "Banner not found";
  return banner;
}
