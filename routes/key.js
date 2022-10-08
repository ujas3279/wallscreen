const express = require("express")
const router = express.Router()

const {getKeyById,createKey,getKey} = require("../controllers/key")

//params
// router.param("userId", getUserById);
 router.param("keyId", getKeyById)

//actual router goes here

//create
router.post("/key/create/:keyId",createKey)

//read
router.get("/key/:keyId", getKey)

module.exports = router;