const express = require("express");
const router = express.Router();
const authorize = require("../_middleware/authorize");
const slabService = require("../controller/slabs.services");

router.post("/getAll", slabService.slabListDataPageWise);
router.get("/:id", slabService.getById);
router.post("/", slabService.create);
router.put("/:id", authorize(), slabService.update);
router.delete("/:id", slabService.delete);

module.exports = router;
