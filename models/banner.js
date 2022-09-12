const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema;

const bannerSchema = new mongoose.Schema({
    type: {
        type: String,
        trim: true,
        required: true,
        maxlength: 32,
    },
    category: {
        type: ObjectId,
        ref: "Category",
        required: true
    },
    url: {
        type: String,
        required: true
    }

}, 
{timestamps: true}
);

module.exports = mongoose.model("Banner", bannerSchema)