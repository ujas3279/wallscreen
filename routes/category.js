const express = require("express")
const router = express.Router()

const {updateCategoryImage,getCategoryById,createCategory,getCategory,getAllCategory,updateCategory,removeCategory} = require("../controllers/category")

//params
// router.param("userId", getUserById);
 router.param("categoryId", getCategoryById)

//actual router goes here

//create
router.post("/category/create",createCategory)
router.post("/category/edit",updateCategoryImage)

//read
router.get("/category/:categoryId", getCategory)
router.get("/categories",  getAllCategory)

//update
router.put("/category/:categoryId/",updateCategory)


//delete
router.delete("/category/:categoryId",removeCategory)



module.exports = router;