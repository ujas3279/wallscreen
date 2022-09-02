const Category = require("../models/category")
const formidable = require("formidable");
const {uploadImageToS3,removeImageFromS3} = require("../services/awsService");
const fs = require("fs");

exports.getCategoryById = (req,res,next,id) =>{

    Category.findById(id).exec((err, cate) =>{

        if(err){
            return res.status(400).json({
                error: "Category not found in DB"
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
            return res.status(400).json({
                error : "Problem with image"
            });
        }

        //destructure the fields
        const {categoryName} = fields;

        if(!categoryName ){
            return res.status(400).json({
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
                return res.status(400).json({
                    error: "Saving category in db is failed"
                })
            }

            res.json(category)
        } )
    });

}

exports.getCategory = (req,res) =>{
    return res.json(req.category);
}

exports.getAllCategory = (req,res) =>{
    
    Category.find().exec((err,categories) => {
        if(err){
            return res.status(400).json({
                error: "No categories found "
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
            return res.status(400).json({
                error: "Failed to update category "
            })
        }

        res.json(updatedCategory);
    })
}


exports.removeCategory = (req,res) =>{
    const category = req.category;
    const url = category.url;

    category.remove(async (err,category) =>{
        if(err){
            return res.status(400).json({
                error: "Failed to delete category "
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