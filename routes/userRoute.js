const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController.js");
const authController = require("../controllers/authController.js");

// Admin only routes
router.get("/", authController.protect, userController.getAllUsers);

// User routes
router.get("/:id",authController.protect, userController.getUserById);
router.put("/:id",authController.protect, userController.updateUser);
router.delete("/:id",authController.protect, userController.deleteUser);
router.post("/:propertyId/add-to-favorites", authController.protect, userController.addToFavorites);
router.delete("/:propertyId/remove-from-favorites", authController.protect, userController.removeFromFavorites);

module.exports = router;
