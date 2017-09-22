//convert es6
//const functions = require('firebase-functions');
var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors =  require('cors')({origin: true});
var webpush = require('web-push');
//key file (from firebase)
var serviceAccount = require('./pwagram-firebase-admin-key.json');
//for parsing form data/file uploads
var formidable = require('formidable');
var fs = require('fs');
var UUID = require('uuid-v4');

//google cloud services config
var gcconfig = {
    projectId: 'pwagram-5acb8', //from firebase project settings
    keyFileName: 'pwagram-firebase-admin-key.json'
};
//google cloud storage
var gcs = require('@google-cloud/storage')(gcconfig);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

//init app
//read key file
//details on firebase db settings page
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pwagram-5acb8.firebaseio.com"
});

// convert es6
//exports.storePostData = functions.https.onRequest((request, response) => {
//    response.send("Hello from Firebase!");
//});
exports.storePostData = functions.https.onRequest(function(request, response) {
    console.log('Hello from Firebase!');
    //push new post to db and send notification
    cors(request, response, function() {
        //init uuid - unique id for download path
        var uuid = UUID();

        //extract form data
        var formData = new formidable.IncomingForm();
        formData.parse(request, function(err, fields, files) {
            fs.rename(files.file.path, '/tmp/' + files.file.name); //set file path on google-cloud
            var bucket = gcs.bucket('pwagram-5acb8.appspot.com'); //cloud storage

            //upload to storage
            bucket.upload('/tmp/' + files.file.name, {
                uploadType: 'media',
                metadata: {
                    metadata: {
                        contentType: files.file.type,
                        firebaseStorageDownloadTokens: uuid
                    }
                },
            }, function(err, file) {
                //callback function
                if (!err) {
                    //connect to firebase db and push new post
                    admin.database().ref('posts').push({
                        id: fields.id,
                        title: fields.title,
                        location: fields.location,
                        rawLocation: {
                            lat: fields.rawLocationLat,
                            lng: fields.rawLocationLng
                        },
                        //image: fields.body.image
                        image: 'https://firebasestorage.googleapis.com/v0/b/' + bucket.name + '/o/' + encodeURIComponent(file.name) + '?alt=media&token=' + uuid
                    })
                    .then(function(){
                        //authentication
                        //with web-push package:
                        //Public Key: BEwDbohq-fnCLZxm386PV5a1mL1T6071a0Bt7IJdytHo-CUbk7tw0Fo-3OzV5cMjRmAlTwCt_FlyZc-m0DRH7bs
                        //Private Key:Hu0YYSGCP43wpCQD4ulcz4Fp_hbdp7_7GKmgxOtQNlw
                        webpush.setVapidDetails(
                            'mailto:nikola.babic@gmail.com',
                            'BEwDbohq-fnCLZxm386PV5a1mL1T6071a0Bt7IJdytHo-CUbk7tw0Fo-3OzV5cMjRmAlTwCt_FlyZc-m0DRH7bs',
                            'Hu0YYSGCP43wpCQD4ulcz4Fp_hbdp7_7GKmgxOtQNlw'
                        );

                        return admin.database.ref('subscriptions').once('value');
                    })
                    .then(function(subscriptions) {
                        console.log('subscriptions:', subscriptions);
                        //prepare message and send push notification message
                        subscriptions.forEach(function(sub) {
                            //extract data from each subscription
                            var pushConfig = {
                                endpoint: sub.val().endpoint,
                                keys: {
                                    auth: sub.val().auth,
                                    p256dh: sub.val().p256dh
                                }
                            };

                            //send notification
                            webpush.sendNotification(
                                pushConfig,
                                JSON.stringify({
                                    title: 'New Post',
                                    content: 'New Post Added!',
                                    openUrl: '/help'
                                })
                            )
                            .catch(function(err) {
                                console.log('Error sending push notification', err);
                            });
                        });
                        response.status(201).json({
                            message: 'Data stored successfully.',
                            //id: request.body.id
                            id: fields.id
                        });
                    })
                    .catch(function(err){
                        response.status(500).json({
                            error: err
                        });
                    });
                } else {
                    console.log('File upload error...', err);
                }
            });

        });

        
    });
    //response.send("Hello from Firebase!");
});