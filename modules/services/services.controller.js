const Joi = require("joi");
const express = require('express');
const router = express.Router();
const authorize = require("../../_middleware/authorize");
const servicesService = require("./services.service");
const validateRequest = require("../../_middleware/validate-request");

router.get('/', getAll);
router.get('/:id', authorize(), getById);
router.post('/', createSchema, create);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);

module.exports = router;

function createSchema(req, res, next) {
    const schema = Joi.object({
        serviceName : Joi.string().required(),
        serviceDetail : Joi.string()
    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {
    servicesService.create(req.body)
        .then(service => res.json(service))
        .catch(next);
}

function getById(req, res, next) {
    servicesService.getById(req.params.id)
        .then(service => service ? res.json(service) : res.sendStatus(404))
        .catch(next);
}

function updateSchema(req, res, next) {
    const schemaRules = {
        serviceName :Joi.string().empty(''),
        serviceDetail : Joi.string().empty(''),
        serviceImage : Joi.string().empty('')
    };

    validateRequest(req, next, schemaRules);
}

function update(req, res, next) {
    servicesService.update(req.params.id, req.body)
        .then(service => res.json(service))
        .catch(next);
}

function _delete(req, res, next) {
    servicesService.delete(req.params.id)
        .then(() => res.json({ message: 'services deleted successfully' }))
        .catch(next);
}

function getAll(req, res, next) {
    servicesService.getAll()
        .then(service => res.json(service))
        .catch(next);
}