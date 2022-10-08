const Key = require("../models/key");


exports.getKeyById = (req,res,next,id) =>{

    Key.findById(id).exec((err, cate) =>{

        if(err){
            return res.json({
                success:false,
                error: "Category not found in DB",errorMessage: err
            })
        }

        req.key = cate
        next() 

    })
}

exports.createKey = async (req,res) =>{
    const key = req.key;
    key.banner = req.body.banner;
    key.fullBanner = req.body.fullBanner;

    key.save((err, updatedCategory) => {
        if(err){
            return res.json({
                success:false,
                error: "Failed to update category ",errorMessage: err
            })
        }

        res.json({success:true,message: "Key Updated Successfully"});
    })
}

exports.getKey = (req,res) =>{
    return res.json(req.key);
}


