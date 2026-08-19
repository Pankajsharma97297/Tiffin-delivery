const express = require("express");

const {
  getAllTablesData,
  getTableData,
  getTables,
} = require("../controllers/dataController");

const router = express.Router();

router.get("/", getAllTablesData);
router.get("/tables", getTables);
router.get("/:table", getTableData);

module.exports = router;
