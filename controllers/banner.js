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
                success:false,
                error: "banner not found in DB",errorMessage: err
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
                success:false,
                message : "Problem with image",errorMessage: err
            });
        }

        //destructure the fields
        const {category,type} = fields;

        if(!category && !type){
            return res.status(400).json({
                success:false,
                message: "Please include all fields"
            })
        }
       Banner.find({type:type}).exec((err,data)=>{
        if(data.length >= 3){
            return res.status(400).json({success:false,message : "already 3 banner exist for type "+type})
        }
        else{
       
       Banner.findOne({type:type,category:category},async (err,banner)=>{
        if(banner && !err){
            return res.json({success:false,message: "Banner Already Exist"});
        }
        else if(err){
            return res.status(400).json({success:false,"message": err});
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
                    success:false,
                    error: "Saving banner in db is failed",
                    errorMessage: err
                })
            }

            res.json({success: "true"})
        });}
      });
           
    }
})
    });

}

exports.getbanner = (req,res) =>{
    return res.json(req.banner);
}

exports.getAllbanner = async (req,res) =>{
    
    const New = await Banner.find({type:'New'}).populate("category","categoryName");
    const Popular = await Banner.find({type:'Popular'}).populate("category","categoryName");
    const Trending = await Banner.find({type:'Trending'}).populate("category","categoryName");
        let data={
            success:true,
            message:"success",
            "data":[
                {
                    "type":"Popular",
                    "data":Popular
                },
                {
                    "type":"Trending",
                    "data":Trending
                },
                {
                    "type":"New",
                    "data":New
                }
            ]
        }

        res.json(data);
    
}

exports.updatebanner = (req,res) =>{
    const banner = req.banner;
    banner.categoryName = req.body.categoryName;
    banner.type = req.body.type;

    banner.save((err, updatedbanner) => {
        if(err){
            return res.status(400).json({
                success:false,
                error: "Failed to update banner ",errorMessage: err
            })
        }

        res.json({"success": "true"});
    })
}


exports.removebanner = (req,res) =>{
    const banner = req.banner;
    const url = banner.url;

    banner.remove(async (err,banner) =>{
        if(err){
            return res.status(400).json({
                success:false,
                error: "Failed to delete banner ",errorMessage: err
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
            success: "true",
            message: "Successfull deleted"
        })
    })
}