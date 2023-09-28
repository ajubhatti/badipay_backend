const express = require("express");
const router = express.Router();
const utilityServices = require("../controller/utility.services");

const getAll = (req, res, next) => {
  utilityServices
    .getAll()
    .then((utility) =>
      res.status(200).json({
        type: "success",
        message: "Utility get successfully",
        data: {
          utility,
        },
      })
    )
    .catch(next);
};

const create = (req, res, next) => {
  utilityServices
    .create(req.body)
    .then((wallet) =>
      res.status(200).json({
        type: "success",
        message: "Utility created succesfully",
        data: {
          wallet,
        },
      })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  utilityServices
    .getById(req.params.id)
    .then((wallet) =>
      res.json({ status: 200, data: wallet, message: "success" })
    )
    .catch(next);
};

const updateById = (req, res, next) => {
  utilityServices
    .update(req.params.id, req.body)
    .then((wallet) =>
      res.status(200).json({
        status: 200,
        message: "Utility updated successfully",
        data: {
          wallet,
        },
      })
    )
    .catch(next);
};

const deleteById = (req, res, next) => {
  utilityServices
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
