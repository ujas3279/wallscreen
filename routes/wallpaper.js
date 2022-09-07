const express = require("express")
const router = express.Router();


const {getAllwallpapersBySearch,increaseDownloadCount,increaseViewCount,getAllwallpapersBycategory,getwallpaperById, createwallpaper, getwallpaper,updatewallpaper,deletewallpaper,getAllwallpapers,getAllUniqueCategories} = require("../controllers/wallpaper");

//params
// router.param("userId", getUserById);
 router.param("wallpaperId", getwallpaperById);


// create routes
router.post("/wallpaper/create/", createwallpaper)
router.get("/wallpaper/views/:wallpaperId",increaseViewCount)
router.get("/wallpaper/search/",getAllwallpapersBySearch)
router.get("/wallpaper/downloads/:wallpaperId",increaseDownloadCount)
//read routes
router.get("/wallpaper/:wallpaperId",getwallpaper)

//router.get("/wallpaper/photo/:wallpaperId",photo)

//delete route
router.delete("/wallpaper/:wallpaperId",deletewallpaper)

//update route
router.put("/wallpaper/:wallpaperId",updatewallpaper)

//listing route
router.get("/wallpapers", getAllwallpapers)
router.get("/wallpapersbycategory", getAllwallpapersBycategory)

router.get("/wallpapers/categories",getAllUniqueCategories)

module.exports = router;