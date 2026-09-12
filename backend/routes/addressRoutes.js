const express = require("express");
const router = express.Router();
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress
} = require("../controllers/addressController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.use(authenticateToken);

router.get("/", getAddresses);
router.post("/", createAddress);
router.patch("/:id", updateAddress);
router.delete("/:id", deleteAddress);

module.exports = router;
