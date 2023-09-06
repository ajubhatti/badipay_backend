const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const rechargeComplaintService = require("../controller/rechargeComplaints.service");

const create = (req, res, next) => {
  rechargeComplaintService
    .create(req.body)
    .then((banks) => res.json({ status: 200, data: banks, message: "success" }))
    .catch(next);
};

const getById = (req, res, next) => {
  rechargeComplaintService
    .getById(req.params.id)
    .then((banks) => res.json({ status: 200, data: banks, message: "success" }))
    .catch(next);
};

const update = (req, res, next) => {
  rechargeComplaintService
    .update(req.params.id, req.body)
    .then((banks) => res.json({ status: 200, data: banks, message: "success" }))
    .catch(next);
};

const _delete = (req, res, next) => {
  rechargeComplaintService
    .delete(req.params.id)
    .then(() =>
      res.json({ status: 200, data: [], message: "Bank deleted successfully" })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  rechargeComplaintService
    .getAll()
    .then((banks) => res.json({ status: 200, data: banks, message: "success" }))
    .catch(next);
};

const createRechargeComplaints = (req, res, next) => {
  rechargeComplaintService
    .createRechargeComplaints(req.body)
    .then((banks) => res.json({ status: 200, data: banks, message: "success" }))
    .catch(next);
};

router.get("/", getAll);
router.get("/:id", authorize(), getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", _delete);
router.post("/create", createRechargeComplaints);

module.exports = router;
