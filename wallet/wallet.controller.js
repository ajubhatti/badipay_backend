const express = require('express');
const router = express.Router();
const Joi = require("joi");
const authorize = require("../_middleware/authorize");
const validateRequest = require("../_middleware/validate-request");
const walletServices = require('./wallet.service');


router.get('/', getAll);
router.post('/',createSchema, create);
router.get('/:id', getById);
router.put('/:id', updateSchema,updateById);
router.delete('/:id', deleteById);

module.exports = router;

function getAll(req, res, next) {
    walletServices.getAll()
        .then(wallets => res.json(walletes))
        .catch(next);
}

function createSchema(req,res,next) { 
    const schema = Joi.object({
        userId: Joi.string().required(),
        amount: Joi.number().required(),
        slipNo: Joi.string(),
        note: Joi.string(),
        remark: Joi.string(),
        paymentType: Joi.number(),
        bank: Joi.number(),
        referenceNo: Joi.string().required(),
        depositBank: Joi.number(),
        depositBranch: Joi.string(),
        remark: Joi.string(),
        debitAmount: Joi.number(),
        creditAmount: Joi.number(),
        finalWalletAmount: Joi.number(),
        approveBy: Joi.number(),
        approveDate: Joi.date(),
        password: Joi.string()
    });
    validateRequest(req, next, schema);
}

function create(req,res,next) { 
    walletServices.create(req.body)
        .then(wallet => res.json(wallet))
        .catch(next);
}

function getById(req, res, next) { 
    walletServices.getById(req.params.id)
        .then(wallet => res.json(wallet))
        .catch(next);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        userId: Joi.string().required(),
        amount: Joi.number().required(),
        slipNo: Joi.string(),
        note: Joi.string(),
        remark: Joi.string(),
        paymentType: Joi.number(),
        bank: Joi.number(),
        referenceNo: Joi.string().required(),
        depositBank: Joi.number(),
        depositBranch: Joi.string(),
        remark: Joi.string(),
        debitAmount: Joi.number(),
        creditAmount: Joi.number(),
        finalWalletAmount: Joi.number(),
        approveBy: Joi.number(),
        approveDate: Joi.date(),
        password: Joi.string()
    });
    validateRequest(req, next, schema);
}

function updateById(req, res, next) {
    walletServices.update(req.params.id, req.body)
        .then(wallet => res.json(wallet))
        .catch(next);
}

function deleteById(req, res, next) { 
    walletServices.delete(req.params.id)
        .then(wallet => res.json(wallet))
        .catch(next);
}
