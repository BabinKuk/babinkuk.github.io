var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var picture;
var locationButton = document.querySelector('#location-btn');
var locationLoader = document.querySelector('#location-loader');
var fetchedLocation = {
  lat: 0,
  lng: 0
};

//init media elements
function initializeMedia() {
  //check for media elements on as many devices
  console.log('Check for device camera, microphone and other input media devices...', navigator);
  
  //mediaDevices is api that gives access to device camera/media inputs
  //custom polyfill!!!!!
  //for browsers that dont support media devices
  if (!('mediaDevices' in navigator)) {
    //add new empty mediaDevices obj
    navigator.mediaDevices = {};
  }

  //check for getUserMedia Property
  if (!('getUserMedia' in navigator.mediaDevices)) {
    //create new getUserMedia (using different browser implementations)
    navigator.mediaDevices.getUserMedia = function(constraints) {
      //safari and mozila implementations
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      //other browser is used, media is not implemented, throw error
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented!'));
      }

      //we have user media
      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }

  //for browsers that support media devices
  //or use our custom polyfill above
  //acces video/camer on the device
  navigator.mediaDevices.getUserMedia({video: true})
    .then(function(stream) {
      //we have access to video/camera
      videoPlayer.srcObject = stream; //autoplay
      videoPlayer.style.display = 'block';
    })
    .catch(function(err) {
      //no permission to video/camera, display image picker
      imagePickerArea.style.display = 'block';
    });
}

function initializeLocation() {
  //check geolocation support
  console.log('Check geolocation...', navigator);
  if (!('geolocation' in navigator)) {
    console.log('hide button');
    locationButton.style.display = 'none';
  }
}

//location button event listener
locationButton.addEventListener('click', function(event) {
  console.log('Location button clicked...', event);
  //check geolocation support
  if (!('geolocation' in navigator)) {
    return;
  }
  
  //alert displayed flg
  var alertDisplayed = false;

  locationButton.style.display = 'none';
  locationLoader.style.display = 'block';

  navigator.geolocation.getCurrentPosition(function(position) {
    console.log('current position', position);
    locationButton.style.display = 'inline';
    locationLoader.style.display = 'none';
    fetchedLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    //default value
    locationInput.value = 'In Pula';
    document.querySelector('#manual-location').classList.add('is-focused');
  }, function(err) {
    console.log('Error getting location', err);
    locationButton.style.display = 'inline';
    locationLoader.style.display = 'none';
    //display alert once
    if (!alertDisplayed) {
      alertDisplayed = true;
      alert('Couldn\'t get position, please enter manually.');
    }
    fetchedLocation = {
      lat: 0,
      lng: 0
    };
  }, {timeout: 5000}); //wait 5s to get position
});

//capture button event handler
captureButton.addEventListener('click', function(event) {
  console.log('Capturing video...');
  //if video is displayed, 
  //capture button will extract image from video stream
  //and send it to canvas element
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';
  //canvas context
  var context = canvasElement.getContext('2d'); 
  //draw 2d image
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight/(videoPlayer.videoWidth/canvas.width));
  //close all running video/camera tracks
  videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
    track.stop();
  });
  //convert picture to file
  picture = dataURItoBlob(canvasElement.toDataURL());
});

//image picker event handler
imagePicker.addEventListener('change', function(event) {
  console.log('Image picking...', event);
  //get from file browser
  picture = event.target.files[0];
});

//open modal handler
function openCreatePostModal() {
  //not needed createPostArea.style.display = 'block';
  //css animation
  setTimeout(function() {
    createPostArea.style.transform = 'translateY(0)'; //end position
  }, 1); //1ms is enough
  
  //init
  initializeMedia();
  initializeLocation();

  //display install prompt banner
  if(defferedPrompt){
    //display prompt banner
    defferedPrompt.prompt();
    
    //check what user clicked
    defferedPrompt.userChoice.then(function(choiceResult){
      console.log(choiceResult.outcome);
      //close button is clicked
      if(choiceResult.outcome === 'dismissed'){
        console.log('User cancelled installation...');
      } else {
        console.log('User added app to homescreen...');
      }

      defferedPrompt = null;
    });
  }

  /*
  //unregister sw - for practice purpose only!!
  if ('serviceWorker' in navigator) {
    console.log('unregister sw... not much sense...');
    navigator.serviceWorker.getRegistrations()
      .then(function(registrations) {
        for (var i = 0; i < registrations.length; i++) {
          registrations[i].unregister();
        }
      })
  }
  */
}

function closeCreatePostModal() {
  //hide video and image picker, location elements
  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  locationButton.style.display = 'inline';
  locationLoader.style.display = 'none';
  captureButton.style.display = 'inline';
  
  //close all running video/camera tracks
  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
      track.stop();
    });
  }
  setTimeout(function() {
    createPostArea.style.transform = 'translateY(100vh)'; //animmate back start position
  }, 1); //1ms
  //not needed createPostArea.style.display = 'none';
}

//save button handler
//allows to save assets in cache on demand
//currently not in use
function onSaveButtonClicked(event) {
  console.log('save clicked - cache assets on demand');
  /*uncomment if needed
  //check if cache is supported in browser
  if ('caches' in window) {
    //cache everything needed to display the card: url, image
    caches.open('user-requested')
      .then(function (cache) {
        cache.add('https://httpbin.org/get');
        cache.add('/src/images/sf-boat.jpg');
      });
  }
  */
}

//red plus button
shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

//clear card
function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

// creating html card element
function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  //dummy data
  //cardTitle.style.backgroundImage = 'url("/src/images/sf-boat.jpg")';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  //set inside feed.css
  //cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  //dummy data
  //cardTitleTextElement.textContent = 'San Francisco Trip';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  //dummy data
  //cardSupportingText.textContent = 'In San Francisco';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  //save button
  var cardSaveButton = document.createElement('button');
  cardSaveButton.textContent = 'Save';
  cardSaveButton.addEventListener('click', onSaveButtonClicked);
  cardSupportingText.appendChild(cardSaveButton);
    
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

//helper function to loop data from firebase
function updateUI(data) {
  //clear card with old data
  clearCards();
  for (var i = 0; i < data.length; i++) {
    var element = data[i];
    //create card for each element
    createCard(element);
  }
}

//test url
//var url = 'https://httpbin.org/post';
//data url (firebase)
var url = 'https://pwagram-5acb8.firebaseio.com/posts.json';
var networkDataReceived = false;

//event that triggers create card
fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    //use data
    console.log('data from web, create card ', data);
    networkDataReceived = true;
    //parse data
    var dataArray = [];
    for (var key in data) {
      console.log('key: ' + key);
      dataArray.push(data[key]);
    }
    //create cards with new data
    updateUI(dataArray);
  });

/* not used, indexDb is used instead
if('caches' in window){
  caches.match(url)
    .then(function(response) {
      //if data exist
      if (response) {
        return response.json();
      }
    })
    .then(function (data) {
      //use data
      console.log('data from cache, create card ', data);
      //create a card only if web data is not received
      if (!networkDataReceived) {
        //parse data
        var dataArray = [];
        for (var key in data) {
          console.log('key: ' + key);
          dataArray.push(data[key]);
        }
        //create cards with new data
        updateUI(dataArray);
      }
    });
}*/
if ('indexedDB' in window) {
  readAllData('posts')
    .then(function(data) {
      //use data
      console.log('data from indexdb, create card ', data);
      //create a card only if web data is not received
      if (!networkDataReceived) {
        //create cards with new data
        updateUI(data);
      }
    });
}

//send data 
function sendData() {
  console.log('Sending data...');
  var id = new Date().toISOString();
  var postData = new FormData();
  postData.append('id', id);
  postData.append('title', titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('rawLocationLat', fetchedLocation.lat);
  postData.append('rawLocationLng', fetchedLocation.lng);
  postData.append('file', picture, 'pwagram-' + id + '.png');

  //post request
  //new url after deploying app to firebase
  //fetch(url, {
  fetch('https://us-central1-pwagram-5acb8.cloudfunctions.net/storePostData', {
    method: 'POST',
    /*only json data
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: new Date().toISOString,
      title: titleInput.value,
      location: locationInput.value,
      image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-5acb8.appspot.com/o/sf-boat.jpg?alt=media&token=93ac5acb-ba1b-4672-b850-7e8b6c029c5d'
    })*/
    //form data
    body: postData
  })
  .then(function(res) {
    console.log('Data sent...', res);
    //update UI
    updateUI();
    /*updateUI({
      id: new Date().toISOString,
      title: titleInput.value,
      location: locationInput.value,
      image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-5acb8.appspot.com/o/sf-boat.jpg?alt=media&token=93ac5acb-ba1b-4672-b850-7e8b6c029c5d'
    });*/
  });
}

//form event listener
form.addEventListener('submit', function(event) {
  console.log('form submitting...');
  //prevent submitting the form by default
  event.preventDefault();

  //validate form
  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data!');
    return;
  }

  //close modal
  closeCreatePostModal();

  //register sync task
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    console.log('sw and sync manager ready');
    navigator.serviceWorker.ready
      .then(function(sw) {
        //create post data object (data from screen)
        var post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
          picture: picture,
          rawLocation: fetchedLocation
        };

        //write data onto indexDb
        console.log('Write data for sync into idb', post);
        writeData('sync-posts', post)
          .then(function(){
            return sw.sync.register('sync-new-posts');
          })
          .then(function() {
            //display confirmation
            var snackbarContainer = document.querySelector('#confirmation-toast');
            var data = {message: 'Your post was saved for syncing.'};
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(function(err) {
            console.log('Sync error', err);
          });
      });
  } else {
    //fallback if browser dont support syncing
    sendData();
  }
});