require('dotenv').config()

const aws = require('aws-sdk');
const uuid = require('uuid').v4;
const fs = require('fs');

exports.uploadImageToS3 = async (buffer,fileName,folder) =>{
    const s3 = new aws.S3({
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      });
       return  await s3.upload({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${folder}/${uuid()}-${fileName.replace(' ','-')}`,
        Body: buffer,
      }).promise();   
}

exports.removeImageFromS3 = async (url,callback) =>{
  const s3 = new aws.S3({
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    });
    let imagePath=url.split('/').slice(-2);
    let key= imagePath[0]+'/'+imagePath[1].replace('%20', ' '); 
    s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    }, (err,data)=>{
        if(err)
          callback(err);
        else
          callback(null);
    });
    
}