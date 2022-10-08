const mongoose = require('mongoose')

const keySchema = new mongoose.Schema({
    banner: {
        type: String,
        trim: true
    },
    fullBanner: {
        type: String,
        trim: true
    }

}, 
{timestamps: true}
);

module.exports = mongoose.model("Key", keySchema)