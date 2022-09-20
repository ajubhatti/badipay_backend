const db = require("../_helpers/db");

const fetchAllData = async (params) => {
  try {
    console.log(params.dataBase);
    const pageNumber = parseInt(params.page) || 0;
    const limit = parseInt(params.perPage) || 12;
    const result = {};
    const totalData = await params.dataBase.countDocuments().exec();
    let startIndex = pageNumber * limit;
    const endIndex = (pageNumber + 1) * limit;
    result.totalData = totalData;
    if (startIndex > 0) {
      result.previous = {
        pageNumber: pageNumber - 1,
        limit: limit,
      };
    }
    if (endIndex < (await params.dataBase.countDocuments().exec())) {
      result.next = {
        pageNumber: pageNumber + 1,
        limit: limit,
      };
    }
    result.data = await params.dataBase
      .find()
      .sort("-_id")
      .skip(startIndex)
      .limit(limit)
      .exec();
    result.rowsPerPage = limit;
    return result;
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Sorry, something went wrong" });
  }
};

const fetchDataById = async (params) => {
  try {
    console.log({ params });
    if (!db.isValidId(params.id)) throw "Not found";
    const data = await params.dataBase.findById(params.id);
    if (!data) throw "Not found";
    return data;
  } catch (error) {
    console.log(error);
  }
};

const deleteData = async (params) => {
  const data = await fetchDataById(params);
  await data.remove();
};

module.exports = {
  fetchDataById,
  fetchAllData,
  deleteData,
};
