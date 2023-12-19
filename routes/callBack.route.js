const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const callBackService = require("../controller/callBacks.service");

const create = (req, res, next) => {
  callBackService
    .create(req.body)
    .then((banks) => res.json({ status: 200, data: banks, message: "success" }))
    .catch(next);
};

const getById = (req, res, next) => {
  callBackService
    .getById(req.params.id)
    .then((banks) => res.json({ status: 200, data: banks, message: "success" }))
    .catch(next);
};

const update = (req, res, next) => {
  callBackService
    .update(req.params.id, req.body)
    .then((banks) => res.json({ status: 200, data: banks, message: "success" }))
    .catch(next);
};

const _delete = (req, res, next) => {
  callBackService
    .delete(req.params.id)
    .then(() =>
      res.json({ status: 200, data: [], message: "Bank deleted successfully" })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  callBackService
    .getAll()
    .then((banks) => res.json({ status: 200, data: banks, message: "success" }))
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", authorize(), getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", _delete);

module.exports = router;
