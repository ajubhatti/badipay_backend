const db = require('../_helpers/db');

module.exports = {
    create,
    update,
    getById,
    getAll,
    delete:_delete
}

async function create(params) {
    let serviceExist = await db.Services.findOne({ serviceName: params.serviceName });

    if (serviceExist) {
        throw `name ${params.serviceName} is already added`;
    }    

    const service = new db.Services(params);
    await service.save();
    return service;
}

async function update(id,params) {
    const service = await getService(id);

    if (params.name && service.serviceName !== params.name && await db.Services.findOne({ serviceName: params.name })) {
        throw `Name ${params.name} is already taken`;
    }

    Object.assign(service, params);
    service.updated = Date.now();
    await service.save();

    return service;
}

async function getById(){
    const service = await getService(id);
    return service;
}

async function getAll() {
    const services = await db.Services.find();
    return services;
}

async function _delete(id) {
    const service = await getService(id);
    await service.remove();
}

async function getService(id) {
    if (!db.isValidId(id)) throw 'Service not found';
    const service = await db.Services.findById(id);
    if (!service) throw 'Service not found';
    return service;
}