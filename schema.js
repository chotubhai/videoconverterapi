const mongoose = require('mongoose');
const schema = mongoose.Schema
const video = schema({
    name:{
        type:String,
        // required:true
    },
    key_360:{
        type:String,
    },
    originalKey: {
        type:String,
        // required:true
    }
})

const videoModel = mongoose.model("video",video);
module.exports.videoModel = videoModel;