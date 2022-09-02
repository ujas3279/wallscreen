const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
    type: {
        type: String,
        trim: true,
        required: true,
        maxlength: 32,
    },
    categoryName: {
        type: String,
        trim: true,
        required: true,
        maxlength: 32,
    },
    url: {
        type: String,
        required: true
    }

}, 
{timestamps: true}
);

module.exports = mongoose.model("Banner", bannerSchema)