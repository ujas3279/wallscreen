const Category = require("../models/category");
const Wallpaper = require("../models/wallpaper");
const Banner = require("../models/banner");
const formidable = require("formidable");
const {uploadImageToS3,removeImageFromS3} = require("../services/awsService");
const fs = require("fs");

exports.getCategoryById = (req,res,next,id) =>{

    Category.findById(id).exec((err, cate) =>{

        if(err){
            return res.json({
                success:false,
                error: "Category not found in DB",errorMessage: err
            })
        }

        req.category = cate
        next() 

    })
}

exports.createCategory = async (req,res) =>{
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
        const {categoryName} = fields;

        if(!categoryName ){
            return res.json({
                success:false,
                error: "Please include all fields"
            })
        }


        let category = new Category(fields);


        //handle files here
        if(file.photo){
            let buffer = fs.readFileSync(file.photo.filepath);
            let data= await uploadImageToS3(buffer,file.photo.originalFilename,'category');
            category.url=data.Location;
        }  

        //save DB
        category.save((err,category) => {
            if(err){
                return res.json({
                    success:false,
                    error: "Saving category in db is failed",errorMessage: err,message: "Same Category Already Exist"
                })
            }

            res.json({success: true,message: "Category Added Successfully"})
        } )
    });

}

exports.getCategory = (req,res) =>{
    return res.json(req.category);
}

exports.getAllCategory = (req,res) =>{
    
    Category.find().exec((err,categories) => {
        if(err){
            return res.json({
                success:false,
                error: "No categories found ",errorMessage: err
            })
        }
        let data={
            "success":true,
            "message":"success",
            "data":categories
        }

        res.json(data);
    })
}

exports.updateCategory = (req,res) =>{
    const category = req.category;
    category.categoryName = req.body.categoryName;

    category.save((err, updatedCategory) => {
        if(err){
            return res.json({
                success:false,
                error: "Failed to update category ",errorMessage: err
            })
        }

        res.json({success:true,message: "Category Updated Successfully"});
    })
}


exports.removeCategory = (req,res) =>{
    const category = req.category;
    const url = category.url;

    category.remove(async (err,category) =>{
        if(err){
            return res.json({
                success:false,
                error: "Failed to delete category ",errorMessage: err
            })
        }
        await Wallpaper.remove({ category: category._id });
        await Banner.remove({ category: category._id });
        if(url)
        {
            removeImageFromS3(url,(err)=>{
                if(err)
                  console.log(err);
                console.log('success');
            });
        }
        res.json({
            success: true,
            message: "Successfully deleted"
        })
    })
}