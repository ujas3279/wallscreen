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
            return res.status(400).json({
                error: "wallpaper not found"
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
            return res.status(400).json({
                error : "Problem with image"
            });
        }

        //destructure the fields
        const {displayName, url, rawUrl, category, downloads, views} = fields;


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
            await sharp(file.photo.filepath).jpeg( { quality: 30 } ).toBuffer().then(async (outputBuffer)=> {
                let data= await uploadImageToS3(outputBuffer,file.photo.originalFilename,'wallpaper');
                wallpaper.url=data.Location;
             });
        }

        //save DB
        wallpaper.save((err,wallpaper) => {
            if(err){
                return res.status(400).json({
                    error: "Saving wallpaper in db is failed"
                })
            }

            res.status(200).json(wallpaper)
        })
    });
};

exports.getwallpaper= (req,res) =>{
    
    return res.json(req.wallpaper)
}

//middele ware
// exports.photo = (req,res,next) => {
//     if(req.wallpaper.photo.data){
//         res.set("Content-Type", req.wallpaper.photo.contentType)
//         return res.send(req.wallpaper.photo.data)
//     }
//     next();
// }

//delete Controller
exports.deletewallpaper = (req,res) =>{
    let wallpaper = req.wallpaper;
    let url = wallpaper.url;
    let rawUrl = wallpaper.rawUrl;
    wallpaper.remove((err,deletedwallpaper) => {
        if(err){
            return res.status(400).json({
                error: "Failed to delete the wallpaper"
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
            message: "Deletion was a success"
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
            return res.status(400).json({
                error : "Problem with image"
            });
        }

        //update wallpaper
        let wallpaper = req.wallpaper;
        wallpaper = _.extend(wallpaper,fields)


        //save DB
        wallpaper.save((err,wallpaper) => {
            if(err){
                return res.status(400).json({
                    error: "Uodate wallpaper in db is failed"
                })
            }

            res.json(wallpaper)
        } )
    });
}


//wallpaper listining
exports.getAllwallpapers = (req,res) =>{
    let limit = req.query.limit ? parseInt(req.query.limit) : 10
    let page = req.query.page ? parseInt(req.query.page) : 1
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id"

    Wallpaper.find()
    .populate("category","categoryName")
    .sort([[sortBy, "desc"]]).skip((page-1) * limit)
    .limit(limit)
    .exec((err, wallpapers) => {
        if(err){
            return res.status(400).json({
                error: "No wallpaper found"
            })
        }
        Wallpaper.estimatedDocumentCount({}).exec((count_error, count) => {
            if (err) {
              return res.json(count_error);
            }
            return res.json({
              message:"success",
              status: true,
              data:{
              total_data: count,
              total_page: (count>limit)?(count%limit==0)?count/limit:(count/limit)+1:1,
              page: page,
              pageSize: wallpapers.length,
              data: wallpapers
              }
            });
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
    .exec((err, wallpapers) => {
        if(err){
            return res.status(400).json({
                error: "No wallpaper found"
            })
        }
        Wallpaper.estimatedDocumentCount({category: cat}).exec((count_error, count) => {
            if (err) {
              return res.json(count_error);
            }
            return res.json({
              message:"success",
              status: true,
              data:{
              total_data: count,
              total_page: (count>limit)?(count%limit==0)?count/limit:(count/limit)+1:1,
              page: page,
              pageSize: wallpapers.length,
              data: wallpapers
              }
            });
          });
    })
}


exports.getAllUniqueCategories = (req,res) => {
    Wallpaper.distinct("category", {}, (err,category) => {
        if(err){
            return res.status(400).json({
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
    Wallpaper.updateOne({ views: sequelize.literal('views + 1') }, { where: { _id: req.query.id } },(err,data)=>{
           if(err){
            return res.status(400).json("error");
           }
           else{
            res.status(200).json("Updated");
           }
    });
}

//update stock based on purchase
// exports.updateStock = (req,res,next) => {
//     let myOperation = req.body.order.wallpapers.map(prod => {
//         return {
//             updateOne: {
//                 filter : {_id : prod._id},
//                 update : {$inc: {stock: -prod.count, sold: +prod.count}}
//             }
//         }
//     })
//     wallpaper.bulkWrite(myOperation, {}, (err,wallpapers) => {
//         if(err){
//             return res.status(400).json({
//                 error: "Bulk operation failed"
//             })
//         }
//         next()
//     });
// }

