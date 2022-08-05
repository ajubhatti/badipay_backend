const express = require("express");
const router = express.Router();
const supportServices = require("./support.services");

const create = (req, res, next) => {
  supportServices
    .create(req.body)
    .then((data) => res.json({ status: 200, data: data, message: "success" }))
    .catch(next);
};

const getById = (req, res, next) => {
  supportServices
    .getById(req.params.id)
    .then((data) => res.json({ status: 200, data: data, message: "success" }))
    .catch(next);
};

const update = (req, res, next) => {
  supportServices
    .update(req.params.id, req.body)
    .then((data) => res.json({ status: 200, data: data, message: "success" }))
    .catch(next);
};

const _delete = (req, res, next) => {
  supportServices
    .deleteById(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "support deleted successfully",
      })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  supportServices
    .getAllDetail()
    .then((data) => res.json({ status: 200, data: data, message: "success" }))
    .catch(next);
};

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getById);
router.put("/:id", update);
router.delete("/:id", _delete);

module.exports = router;
