require("dotenv").config();
const Collectible = require("../model/Collectible");
const S3 = require("aws-sdk/clients/s3");
const fs = require('fs');
const jimp = require('jimp');
const mongoose = require('mongoose');
const multer = require('multer');

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
})

exports.uploadImage = multer({dest: 'static/'}).single('image');
exports.resizeImage = async (req, res, next) => {
    //multer automatski stavlja req.file
    if (!req.file) {
        return next();
    }
    const file = req.file;
    console.log(file);
    const fileStream = fs.createReadStream(file.path);
    const extension = file.mimetype.split('/')[1];
    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: file.filename+extension
    } 
    const result = await s3.upload(uploadParams).promise();
    //link od slika u s3 bucket-u
    req.body.image = result.Location;
    next();
}; 

exports.addCollectible = async(req, res) => {
	const {id, image} = req.body;
    const collectibleWithId = await Collectible.find().where({
        id
    });
    console.log(collectibleWithId);
    if(collectibleWithId[0]) {
        return res.status(400).json({"message": "postoji collectible koji ima isti id!"});
    }
	const newCollectible = new Collectible({
		_id: mongoose.Types.ObjectId(),
		id,
		image
	});
	await newCollectible.save();
	res.json(`http://${req.get('host')}/api/nft?id=${id}`);
}