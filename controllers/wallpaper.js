const Wallpaper = require("../models/wallpaper");
const formidable = require("formidable");
const Math = require("mathjs");
const sizeOf = require('image-size');
const _ = require("lodash");
const fs = require("fs");
var sharp = require('sharp');
const {uploadImageToS3,removeImageFromS3} = require("../services/awsService");
const { sortBy } = require("lodash");

exports.getwallpaperById = (req,res,next,id) =>{
    Wallpaper.findById(id)
    .populate("category")
    .exec((err,wallpaper) => {
        if(err)
        {
            return res.json({
                success:false,
                error: "wallpaper not found",errorMessage: err
            });
        }
        req.wallpaper = wallpaper;
        next();
    });
};

exports.createwallpaper = (req,res) => {
    let form =  new formidable.IncomingForm();
    form.keepExtensions = true;


    form.parse(req,async (err,fields,file) => {
        if(err)
        {
            return res.json({
                success:false,
                error : "Problem with image",errorMessage: err
            });
        }

        //destructure the fields
        const {displayName, category, downloads, views} = fields;


        let wallpaper = new Wallpaper(fields);


        //handle files here
        if(file.photo){
            wallpaper.size = formatBytes(file.photo.size);
            const dimensions = sizeOf(file.photo.filepath);
            wallpaper.resolution = dimensions.width + ' X ' + dimensions.height;
            let buffer = fs.readFileSync(file.photo.filepath);
            let contentType = file.photo.mimetype;
            
            let data= await uploadImageToS3(buffer,file.photo.originalFilename,'rawWallpaper');
            wallpaper.rawUrl=data.Location;
            await sharp(file.photo.filepath).jpeg( { quality: 5 } ).toBuffer().then(async (outputBuffer)=> {
                let data= await uploadImageToS3(outputBuffer,file.photo.originalFilename,'wallpaper');
                wallpaper.url=data.Location;
             });
        }

        //save DB
        wallpaper.save((err,wallpaper) => {
            if(err){
                return res.json({
                    success:false,
                    error: "Saving wallpaper in db is failed",errorMessage: err
                })
            }

            res.status(200).json({message: "Wallpaper Added Successfully",success:true})
        })
    });
};

exports.getwallpaper= (req,res) =>{
    
    return res.json({success:true,data:req.wallpaper
    })
}



//delete Controller
exports.deletewallpaper = (req,res) =>{
    let wallpaper = req.wallpaper;
    let url = wallpaper.url;
    let rawUrl = wallpaper.rawUrl;
    wallpaper.remove((err,deletedwallpaper) => {
        if(err){
            return res.json({
                success:false,
                error: "Failed to delete the wallpaper",errorMessage: err
            })
        }
        if(url || rawUrl)
        {
            removeImageFromS3(url,(err)=>{
                if(err)
                  console.log(err);
                console.log('success');
            });
            removeImageFromS3(rawUrl,(err)=>{
                if(err)
                  console.log(err);
                console.log('success');
            });
        }
        res.json({
            message: "Wallpaper Deleted Successfully",success:true
        })
    })
}

//update controller
exports.updatewallpaper = (req,res) =>{
    let form =  new formidable.IncomingForm();
    form.keepExtensions = true;


    form.parse(req,(err,fields,file) => {
        if(err)
        {
            return res.json({
                success:false,
                error : "Problem with image",errorMessage: err
            });
        }

        //update wallpaper
        let wallpaper = req.wallpaper;
        wallpaper = _.extend(wallpaper,fields)


        //save DB
        wallpaper.save((err,wallpaper) => {
            if(err){
                return res.json({
                    success:false,
                    message: "Uodate wallpaper in db is failed"
                })
            }

            res.json({success:true,message:"Wallpaper Updated Successfully"})
        } )
    });
}


//wallpaper listining
exports.getAllwallpapers = (req,res) =>{
    let limit = req.query.limit ? parseInt(req.query.limit) : 65000
    let page = req.query.page ? parseInt(req.query.page) : 1
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id"

    Wallpaper.find()
    .populate("category","categoryName")
    .sort([[sortBy, "desc"]]).skip((page-1) * limit)
    .limit(limit)
    .exec(async (err, wallpapers) => {
        if(err){
            return res.json({
                success:false,
                error: "No wallpaper found",errorMessage: err
            })
        }
        const count = await Wallpaper.countDocuments();
            return res.json({
              message:"success",
              success: true,
              data:{
              total_data: count,
              total_page: (count%limit==0)?parseInt(count/limit):(parseInt(count/limit))+1,
              page: page,
              pageSize: wallpapers.length,
              data: wallpapers
              }
            });
    })
}
exports.getAllwallpapersBycategory = (req,res) =>{
    let limit = req.query.limit ? parseInt(req.query.limit) : 8
    let page = req.query.page ? parseInt(req.query.page) : 1
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id"
    let cat = req.query.category;

    Wallpaper.find({
        category: cat
      })
    .populate("category","categoryName")
    .sort([[sortBy, "desc"]]).skip((page-1) * limit)
    .limit(limit)
    .exec(async (err, wallpapers) => {
        if(err){
            return res.json({
                success:false,
                error: "No wallpaper found",errorMessage: err
            })
        }
        const count = await Wallpaper.countDocuments({
            category: cat
          });
            return res.json({
              message:"success",
              success: true,
              data:{
              total_data: count,
              total_page: (count%limit==0)?parseInt(count/limit):(parseInt(count/limit))+1,
              page: page,
              pageSize: wallpapers.length,
              data: wallpapers
              }
            });
    })
}


exports.getAllUniqueCategories = (req,res) => {
    Wallpaper.distinct("category", {}, (err,category) => {
        if(err){
            return res.json({
                error: "No category found"
            })
        }
        res.json(category)
    })
}
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
exports.increaseViewCount = (req,res)=>{
    let wallpaper = req.wallpaper;
    wallpaper.views += 1;

    wallpaper.save((err,wallpaper) => {
            if(err){
                return res.json({
                    error: "Uodate wallpaper in db is failed"
                })
            }
            res.status(200).json({"success" : true,"Message": "Views Count updated"});
    });
}
exports.increaseDownloadCount = (req,res)=>{
    let wallpaper = req.wallpaper;
    wallpaper.downloads += 1;

    wallpaper.save((err,wallpaper) => {
            if(err){
                return res.json({
                    success:false,
                    error: "Uodate wallpaper in db is failed",errorMessage: err
                })
            }
            res.status(200).json({"success" : true,"Message": "Downloads Count updated"})
    });
}
exports.getAllwallpapersBySearch = (req,res) =>{
    let limit = req.query.limit ? parseInt(req.query.limit) : 8
    let page = req.query.page ? parseInt(req.query.page) : 1
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id"
    let search = req.query.search;

    Wallpaper.find({$or:[{
        displayName: {$regex : search , $options: "i"}
      },
      {
        categorySearch: {$regex : search , $options: "i"}
      }
    ]})
    .populate("category","categoryName")
    .sort([[sortBy, "desc"]]).skip((page-1) * limit)
    .limit(limit)
    .exec(async (err, wallpapers) => {
        if(err){
            return res.json({
                success:false,
                error: "No wallpaper found",errorMessage: err
            })
        }
        const count = await Wallpaper.countDocuments({$or:[{
            displayName: {$regex : search , $options: "i"}
          },
          {
            categorySearch: {$regex : search , $options: "i"}
          }
        ]});
            return res.json({
              message:"success",
              success: true,
              data:{
              total_data: count,
              total_page: (count%limit==0)?parseInt(count/limit):(parseInt(count/limit))+1,
              page: page,
              pageSize: wallpapers.length,
              data: wallpapers
              }
            });
    })
}