var defferedPrompt;

//enable notifications buttons (there are 2 buttons inside app)
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

//check if browser implements Promise
//if not, activate promise polyfills
if (!window.Promise) {
    window.Promise = Promise;
}

//register sw
//console.log(navigator);
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/sw.js')
        .then(function(){
            console.log('SW registered');
        });
}

//control when the install banner is shown
window.addEventListener('beforeinstallprompt', function(event){
    console.log('before install prompt');
    //dont show install banner
    event.preventDefault();
    //dont do anything
    defferedPrompt = event;
    return false;
});

//check if notifications are supported by the browser
if ('Notification' in window && 'serviceWorker' in navigator) {
    console.log('Notifications supported by the browser', window);
    
    //enable notification buttons
    for (var i=0; i<enableNotificationsButtons.length; i++) {
        enableNotificationsButtons[i].style.display = 'inline-block';
        //notifications event listener
        enableNotificationsButtons[i].addEventListener('click', askForNotificatioPermission);
    }
}

//notification permission handler
function askForNotificatioPermission() {
    console.log('Ask for notification permission...');
    Notification.requestPermission(function(result) {
        console.log('User choice', result);
        if (result !== 'granted') {
            console.log('No notification permission granted.');
        } else {
            //hide button if you want
            
            //set push subscription
            configurePushSub();
            //display confirm
           // displayConfirmNotification();
        }
    })
}

//push subscription setup handler
function configurePushSub() {
    console.log('Push subscription setup');
    //always check for feature availability
    if (!('serviceWorker' in navigator)) {
        return; //exit, cant listen to push notifications
    }

    var reg;
    //get sw registration and all subscriptions
    navigator.serviceWorker.ready
        .then(function(swreg) {
            reg = swreg;
            return swreg.pushManager.getSubscription();
        })
        .then(function(sub) {
            if (sub === null) {
                //create new subscription
                //with web-push package:
                var vapidPublicKey = 'BEwDbohq-fnCLZxm386PV5a1mL1T6071a0Bt7IJdytHo-CUbk7tw0Fo-3OzV5cMjRmAlTwCt_FlyZc-m0DRH7bs';
                var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);

                //identification for creating push messages
                return reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidPublicKey
                });
            } else {
                //we already have subscription
            }
        })
        .then(function(newSub) {
            //push new subscription to server
            fetch('https://pwagram-5acb8.firebaseio.com/subscriptions.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newSub)
            })
            .then(function(res) {
                if (res.ok) {
                    displayConfirmNotification();
                }
            })
            .catch(function(err) {
                console.log('Error creating subscription...', err);
            });
        });
}

//display notification handler
function displayConfirmNotification() {
    console.log('Displaying confirm notification');
    //notification displayed from within the SW
    if ('serviceWorker' in navigator) {
        //notification options
        var options = {
            body: 'You successfully subscribed to our Notification service.',
            icon: '/src/images/icons/app-icon-96x96.png',
            image: '/src/images/sf-boat.jpg',
            dir: 'ltr', //left to right direction
            lang: 'en-US', //BCP 47
            vibrate: [100, 50, 200], //vibration in ms: vibration-pause-vibration
            badge: '/src/images/icons/app-icon-96x96.png',
            tag: 'confirm-notification',
            renotify: true,
            actions: [
                {action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png'},
                {action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png'}
            ]
        };
        navigator.serviceWorker.ready
            .then(function(swreg) {
                swreg.showNotification('You successfully subscribed!', options);
            });
    }
    /*
    //notification displayed from within the browser
    //notification options
    var options = {
        body: 'You successfully subscribed to our Notification service.'
    };
    new Notification('Successfully subscribed!', options);
    */
}
/**
 * callback, promise, fetch examples
 * not crucial for this application
 */
/*
//callback example
setTimeout(function(){
    //callback function
    console.log('Executed when the timeout is done.');
}, 2000);

console.log('Executed after setTimeout().');

//above callback using promise
var promise = new Promise(function(resolve, reject) {
    setTimeout(function(){
        resolve('Resolve: Executed when the timeout is done.');
    }, 2000);
});

//promise is useful when chaining multiple asynsc
promise.then(function(txt) {
    return txt;
}).then(function(newTxt) {
    console.log('newTxt: ' + newTxt);
});

//handling error/reject
var errPromise = new Promise(function(resolve, reject) {
    setTimeout(function(){
        reject({code: 500, message: 'Error occured'});
    }, 2000);
});

//syntax 1
errPromise.then(function(txt) {
    return txt;
}, function (err) {
    console.log(err.code, err.message);
}).then(function(newTxt) {
    console.log(newTxt);
});

//syntax 2 - BETTER!!!
errPromise.then(function(txt) {
    return txt;
}).then(function(newTxt) {
    console.log(newTxt);
}).catch( function (err) {
    console.log(err.code, err.message);
});

//ajax xhr example - FOR REFFERENCE ONLY!!
//not used in service workers!!!
var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://httpbin.org/ip');
xhr.responseType = 'json';
xhr.onload = function () {
    console.log(xhr.response);
}
xhr.onerror = function () {
    console.log('xhr error')
}
xhr.send();

//fetch api examples
fetch('https://httpbin.org/ip')
    .then(function(respoonse) {
        console.log(respoonse);
        return respoonse.json();
    })
    .then(function(data) {
        console.log('parsed json data:', data);
    })
    .catch(function(err) {
        console.log(err);
    });

fetch('https://httpbin.org/post', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    mode: 'cors', // Cross Origin Resource Sharing
    body: JSON.stringify({message: 'Does this work?'})
}).then(function(respoonse) {
    console.log(respoonse);
    return respoonse.json();
}).then(function(data) {
    console.log('parsed json data:', data);
}).catch(function(err) {
   console.log(err);
});
*/