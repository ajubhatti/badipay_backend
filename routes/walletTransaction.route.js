const express = require("express");
const router = express.Router();
const Joi = require("joi");
const authorize = require("../_middleware/authorize");
const validateRequest = require("../_middleware/validate-request");
const walletTransaction = require("../controller/walletTransaction.service");
const walletService = require("../controller/walletTransaction.service");

const getAll = (req, res, next) => {
  walletTransaction
    .getAll(req.body)
    .then((wallets) =>
      res.status(200).json({
        type: "success",
        message: "wallets get successfully",
        data: {
          wallets,
        },
      })
    )
    .catch(next);
};

const create = (req, res, next) => {
  walletTransaction
    .create(req.body)
    .then((wallet) =>
      res.status(200).json({
        type: "success",
        message: "Wallet data created succesfully",
        data: {
          wallet,
        },
      })
    )
    .catch(next);
};

const getById = (req, res, next) => {
  walletTransaction
    .getById(req.params.id)
    .then((wallet) =>
      res.json({ status: 200, data: wallet, message: "success" })
    )
    .catch(next);
};

const getByUserId = (req, res, next) => {
  walletTransaction
    .getTransctionByUserId(req.body.userId)
    .then((wallet) =>
      res.json({ status: 200, data: wallet, message: "success" })
    )
    .catch(next);
};

const updateById = (req, res, next) => {
  walletTransaction
    .update(req.params.id, req.body)
    .then((wallet) =>
      res.status(200).json({
        status: 200,
        message: "wallet updated successfully",
        data: {
          wallet,
        },
      })
    )
    .catch(next);
};

const deleteById = (req, res, next) => {
  walletTransaction
    .delete(req.params.id)
    .then((wallet) =>
      res.status(200).json({
        data: [],
        status: 200,
        message: "wallet transaction deleted successfully",
      })
    )
    .catch(next);
};

const updateExistingBalance = (req, res, next) => {
  walletTransaction
    .updateExistingBalance(req.body)
    .then((wallet) => {
      res.status(200).json({ status: 200, message: "success", data: wallet });
    })
    .catch(next);
};

const changeWalletStatus = (req, res, next) => {
  walletTransaction
    .updateWalletStatus(req.body)
    .then((wallet) => {
      res.status(200).json({ status: 200, message: "success", data: wallet });
    })
    .catch(next);
};

const addByPaymentGateway = (req, res, next) => {
  console.log("check----", req.user.id);
  walletTransaction
    .addByPaymentGateway(req.user.id, req.body)
    .then((wallet) => {
      res.status(200).json({ status: 200, message: "success", data: wallet });
    })
    .catch(next);
};

const checkPaymentGatewayStatus = (req, res, next) => {
  walletTransaction
    .checkPaymentGatewayStatus(req.body)
    .then((wallet) => {
      res.status(200).json({ status: 200, message: "success", data: wallet });
    })
    .catch(next);
};

const paymentGatewayCallback = (req, res, next) => {
  walletTransaction
    .paymentGatewayCallback(req.body)
    .then((wallet) => {
      res.status(200).json({ status: 200, message: "success", data: wallet });
    })
    .catch(next);
};

router.post("/getAll", getAll);
router.post("/", walletService.createWallet);
router.get("/:id", getById);
// router.post("/getByUserId", getByUserId);
router.post("/getByUserId", walletService.walletListDataPageWise);
router.put("/:id", updateById);
router.delete("/:id", deleteById);
router.post("/updateBalance", updateExistingBalance);
router.post("/updateWalletStatus", changeWalletStatus);
router.post("/getWallet", walletService.getwalletListData);
router.post("/addByPaymentGateway", authorize(), addByPaymentGateway);
router.post("/checkPaymentGatewayStatus", checkPaymentGatewayStatus);
router.post("/paymentGatewayCallback", paymentGatewayCallback);

module.exports = router;
