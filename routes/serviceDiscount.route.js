const express = require("express");
const router = express.Router();
const { onlyAdmin, notFound } = require("../_middleware/middleware");

const serviceDiscount = require("../controller/serviceDiscount.service");

const create = (req, res, next) => {
  serviceDiscount
    .create(req.body)
    .then((discount) =>
      res.json({ status: 200, data: discount, message: "success" })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  serviceDiscount
    .getById(req.params.id)
    .then((discount) =>
      res.json({ status: 200, data: discount, message: "success" })
    )
    .catch(next);
};

const update = (req, res, next) => {
  serviceDiscount
    .update(req.params.id, req.body)
    .then((discount) =>
      res.json({ status: 200, data: discount, message: "success" })
    )
    .catch(next);
};

const _delete = (req, res, next) => {
  serviceDiscount
    ._delete(req.params.id)
    .then(() =>
      res.json({
        status: 200,
        data: [],
        message: "discount deleted successfully",
      })
    )
    .catch(next);
};

const getAll = (req, res, next) => {
  serviceDiscount
    .getAll()
    .then((discount) =>
      res.json({ status: 200, data: discount, message: "success" })
    )
    .catch(next);
};

const usersAtPage = (req, res, next) => {
  req.body = [{}, null, { limit: 25, skip: (req.body.page - 1) * 25 }];
  return next();
};

const getDiscountList = (req, res, next) => {
  serviceDiscount
    .getDiscountList(req.body)
    .then((discount) =>
      res.json({ status: 200, data: discount, message: "success" })
    )
    .catch(next);
};

const AddbyScan = (req, res, next) => {
  serviceDiscount
    .AddbyScan()
    .then((service) => {
      res.json({ status: 200, data: service, message: "success" });
    })
    .catch(next);
};

const getAllWithPagination = (req, res, next) => {
  serviceDiscount
    .discountListPageWise(req.body)
    .then((operator) =>
      res.json({ status: 200, data: operator, message: "success" })
    )
    .catch(next);
};

router
  .post("/", create)
  .get("/", usersAtPage, getAll)
  .get("/:id", getById)
  .put("/:id", update)
  .delete("/:id", _delete)
  .post("/getDiscountList", getDiscountList)
  .post("/addbyScan", AddbyScan)
  .post("/getWithPagination", getAllWithPagination)
  .use(notFound);

module.exports = router;
