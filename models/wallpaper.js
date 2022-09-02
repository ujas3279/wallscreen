const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema;


const wallpaperSchema = new mongoose.Schema({
    displayName: {
        type: String,
        trim: true,
        maxlength: 32,
        required: true
    },
    url: {
        type: String,
        trim: true,
        required: true,
        maxlength: 2000

    },
    rawUrl: {
        type: String,
        trim: true,
        required: true,
        maxlength: 2000
    },
    downloads: {
        type: Number,
        required: true,
        maxlength: 32,
        trim: true
    },
    views: {
        type: Number,
        required: true,
        maxlength: 32,
        trim: true
    },
    category: {
        type: ObjectId,
        ref: "Category",
        required: true
    },
    resolution: {
        type: String,
        trim: true,
        required: true,
        maxlength: 2000
    },
    size: {
        type: String,
        trim: true,
        required: true,
        maxlength: 2000
    },
    isPremium: {
        type: Boolean,
        default:false
    },

},{timestamps: true}) ;

module.exports = mongoose.model("Wallpaper", wallpaperSchema)