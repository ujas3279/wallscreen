const express = require("express")
const router = express.Router()

const {getbannerById,createbanner,getbanner,getAllbanner,updatebanner,removebanner} = require("../controllers/banner")

//params
// router.param("userId", getUserById);
 router.param("bannerId", getbannerById)

//actual router goes here

//create
router.post("/banner/create",createbanner)

//read
router.get("/banner/:bannerId", getbanner)
router.get("/banners",  getAllbanner)

//update
router.put("/banner/:bannerId/",updatebanner)


//delete
router.delete("/banner/:bannerId",removebanner)



module.exports = router;