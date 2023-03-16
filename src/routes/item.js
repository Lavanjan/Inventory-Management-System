const express = require("express");
const {
  createItem,
  updateItem,
  getAllItems,
  deleteItem,
} = require("../controllers/item.js");

const router = express.Router();

router.post("/", createItem);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);
router.get("/", getAllItems);

module.exports = router;
