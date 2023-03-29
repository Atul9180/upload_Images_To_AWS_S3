const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path');

const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '/public')));



const s3 = new AWS.S3({
    accessKeyId: 'process.env.ACCESSID',
    secretAccessKey: 'process.env.SECRETACCESSID'
});



// Multer middleware for handling multipart/form-data
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
}).single('image');



// Route for handling image upload
app.post('/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.error(err);
            return res.status(400).send('Error uploading image');
        }

        // Upload the image to S3
        const image = req.file;
        const key = `images/${Date.now()}_${image.originalname}`;
        const params = {
            Bucket: 'process.env.BUCKET',
            Key: key,
            Body: image.buffer,
            ACL: 'public-read'
        };
        s3.upload(params, (err, data) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error uploading image to S3');
            }

            // Return the S3 URL to the client
            const url = data.Location;
            res.send(url);
        });
    });
});


app.use('/', (req, res) => { res.sendFile(path.join(__dirname, '/index.html')) })


app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
