const express = require("express");
const router = express.Router();
const categoryServices = require("../controller/serviceCategory.services");

const getAll = (req, res, next) => {
  categoryServices
    .getAll()
    .then((data) =>
      res.status(200).json({
        status: 200,
        message: "Service category get successfully",
        data: data,
      })
    )
    .catch(next);
};

const create = (req, res, next) => {
  categoryServices  
    .create(req.body)
    .then((data) =>
      res.status(200).json({
        status: 200,
        message: "Service category created succesfully",
        data: data,
      })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  categoryServices
    .getById(req.params.id)
    .then((data) => res.json({ status: 200, data: data, message: "success" }))
    .catch(next);
};

const updateById = (req, res, next) => {
  categoryServices
    .update(req.params.id, req.body)
    .then((data) =>
      res.status(200).json({
        status: 200,
        message: "Service category updated successfully",
        data: data,
      })
    )
    .catch(next);
};

const deleteById = (req, res, next) => {
  categoryServices
    .delete(req.params.id)
    .then(() =>
      res.status(200).json({
        data: {},
        status: 200,
        message: "deleted successfully",
      })
    )
    .catch(next);
};

router.post("/getAll", getAll);
router.post("/", create);
router.get("/:id", getById);
router.put("/:id", updateById);
router.delete("/:id", deleteById);

module.exports = router;
