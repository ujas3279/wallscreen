const Banner = require("../models/banner")
const Category = require("../models/category")
const formidable = require("formidable");
const fs = require("fs");
const {uploadImageToS3,removeImageFromS3} = require("../services/awsService");
const { type } = require("os");

exports.getbannerById = (req,res,next,id) =>{

    Banner.findById(id).exec((err, cate) =>{

        if(err){
            return res.status(400).json({
                error: "banner not found in DB"
            })
        }

        req.banner = cate
        next() 

    })
}

exports.createbanner = async (req,res) =>{
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
        const {categoryName,type} = fields;

        if(!categoryName ){
            return res.status(400).json({
                error: "Please include all fields"
            })
        }
       Banner.findOne({type:type,categoryName:categoryName},async (err,banner)=>{
        if(banner && !err){
            return res.json({"message": "Banner Already Exist"});
        }
        else if(err){
            return res.status(400).json({"message": "Banner Already Exist"});
        }else{
           let banner= new Banner(fields);
        
        //handle files here
        if(file.photo){
            let buffer = fs.readFileSync(file.photo.filepath);
            let data= await uploadImageToS3(buffer,file.photo.originalFilename,'banner');
            banner.url=data.Location;
        }  

        //save DB
        banner.save((err,banner) => {
            if(err){
                return res.status(400).json({
                    error: "Saving banner in db is failed"
                })
            }

            res.json(banner)
        });}
      })
    });

}

exports.getbanner = (req,res) =>{
    return res.json(req.banner);
}

exports.getAllbanner = (req,res) =>{
    let type=req.query.type?req.query.type:/$/;
    
    Banner.find({type:type}).exec((err,banners) => {
        if(err){
            return res.status(400).json({
                error: "No Banners found "
            })
        }
        let data={
            "success":true,
            "message":"success",
            "data":banners
        }

        res.json(data);
    })
}

exports.updatebanner = (req,res) =>{
    const banner = req.banner;
    banner.categoryName = req.body.categoryName;
    banner.type = req.body.type;

    banner.save((err, updatedbanner) => {
        if(err){
            return res.status(400).json({
                error: "Failed to update banner "
            })
        }

        res.json(updatedbanner);
    })
}


exports.removebanner = (req,res) =>{
    const banner = req.banner;
    const url = banner.url;

    banner.remove(async (err,banner) =>{
        if(err){
            return res.status(400).json({
                error: "Failed to delete banner "
            })
        }
        if(url)
        {
            removeImageFromS3(url,(err)=>{
                if(err)
                  console.log(err);
                console.log('success');
            });
        }
        res.json({
            message: "Successfull deleted"
        })
    })
}