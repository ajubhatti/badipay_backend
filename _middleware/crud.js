const { errData, errorRes, successRes } = require("./response");
const mongoose = require("mongoose");

function creates(model, params, populate = []) {
  return (req, res) => {
    const newData = new model({
      _id: new mongoose.Types.ObjectId(),
      ...params,
    });
    return newData
      .save()
      .then((t) => t.populate(...populate, errData(res)))
      .catch((err) => errorRes(res, err));
  };
}

function reads(model, populate = []) {
  return (req, res) =>
    model.find(...req.body, errData(res)).populate(...populate);
}

function updates(model, populate = []) {
  return (req, res) => {
    req.body.updated_at = new Date();
    return model
      .findByIdAndUpdate(req.params._id, req.body, { new: true }, errData(res))
      .populate(...populate);
  };
}

function removes(model) {
  return (req, res) => model.deleteOne({ _id: req.params._id }, errData(res));
}

module.exports = { reads, creates, updates, removes };
