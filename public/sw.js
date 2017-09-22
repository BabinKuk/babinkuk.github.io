/**
 * !!!!!urls after deploying app to firebase!!!!!
 * Project Console: https://console.firebase.google.com/project/pwagram-5acb8/overview
 * Hosting URL: https://pwagram-5acb8.firebaseapp.com
 * Function URL (storePostData): https://us-central1-pwagram-5acb8.cloudfunctions.net/storePostData
 */

//import other script packages
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v5';
var CACHE_DYNAMIC_NAME = 'dynamic-v5';
var STATIC_FILES = [
    //caching minimum number of files
    '/', //MUST BE CACHED!!!!
    '/index.html',
    '/offline.html',
    '/src/js/app.js',
    '/src/js/utility.js',
    '/src/js/feed.js',
    'src/js/material.min.js',
    '/src/js/idb.js',
    '/src/js/promise.js',//polyfills are not mandatory for cache
    '/src/js/fetch.js',//polyfills are not mandatory for cache
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

/**
 * sw is running in the background
 * install and activated events are triggered by the browser
 * fetch is triggered by the application
 */
self.addEventListener('install', function(event){
    console.log('[SW] installing sw...', event);
    //access cache api asap and wait until finish
    event.waitUntil(
        //set cache name (with version)
        caches.open(CACHE_STATIC_NAME)
        .then(function(cache) {
            console.log('[SW] precaching app shell...');
            //cache.add('/'); //MUST BE CACHED!!!!
            //cache.add('/index.html');
            //cache.add('/src/js/app.js');
            //addAll uses array of elements to cache
            cache.addAll(STATIC_FILES);
        })
    );
});

self.addEventListener('activate', function(event){
    console.log('[SW] activating sw...', event);
    //clean old cache
    event.waitUntil(
        caches.keys()
            .then(function(keylist) {
                //array of cache names and convert into promises
                return Promise.all(keylist.map(function(key) {
                    //delete all but current
                    if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                        console.log('[SW] removing old cache...', key);
                        return caches.delete(key);
                    }
                }));
            })
    );
    //return is not mandatory but recommended
    return self.clients.claim();
});

//helper function
function isInArray(str, array){
    //loop arra< for string
    for (var i = 0; i < array.length; i++) {
        if (array[i] === str) {
            //str is inside array
            return true;
        }
    }
    return false;
}

//clean/trim cache helper function
function trimCache(cacheName, maxItems) {
    //open cache and delete the oldest item
    caches.open(cacheName)
        .then(function(cache) {
            return cache.keys()
                .then(function(keys) {
                    if (keys.length > maxItems) {
                        //delete item and call function again (recursively)
                        cache.delete(keys[0])
                            .then(trimCache(cacheName, maxItems));
                    }
                });
    });
}

/**
 * triggered when html is fetching something(css,js,images,data...)
 * analyzing different caching strategies
 */
//1. Cache only strategy - not recommended, for special purposes only 
/*self.addEventListener('fetch', function(event){
    //console.log('[SW] fetching...', event);
    event.respondWith(
        caches.match(event.request)
    );
});*/

//2. network only strategy - not recommended, for special purposes only 
/*self.addEventListener('fetch', function(event){
    //console.log('[SW] fetching...', event);
    event.respondWith(
        fetch(event.request)
    );
});*/

//3. network with cache fallback strategy
//not recommended because when the network is bad (bad/low signal)
//user must wait for network response to fail and then use cache
//bad user experience due to the timeout problem
/*self.addEventListener('fetch', function(event){
    //console.log('[SW] fetching...', event);
    event.respondWith(
        //network
        fetch(event.request)
            .then(function(res){
                //add this response to cache and return
                return caches.open(CACHE_DYNAMIC_NAME)
                .then(function(cache) {
                    cache.put(event.request.url, res.clone());
                    return res;
                })
            })
            .catch(function(err) {
                //network failed, use cache as fallback
                return caches.match(event.request);
            })
    );
})*/

//4. Cache (Dynamic), then network strategy
/*self.addEventListener('fetch', function(event){
    //console.log('[SW] fetching...', event);
    //override older data with the latest
    event.respondWith(
        caches.match(event.request)
        .then(function(response){
            console.log('[SW] fetching from cache and checking valid response...');
            if (response) {
                //fetch from cache
                console.log('[SW] fetch from cache');
                return response;
            } else {
                //fetch from network and add to cache
                console.log('[SW] fetch from network and add to dynamic cache...');
                return fetch(event.request)
                    .then(function(res){
                        //add this response to cache and return
                        return caches.open(CACHE_DYNAMIC_NAME)
                            .then(function(cache) {
                                cache.put(event.request.url, res.clone());
                                return res;
                            })
                    })
                    .catch(function(err){
                        //return offline page
                        return caches.open(CACHE_STATIC_NAME)
                            .then(function(cache){
                                return cache.match('/offline.html');
                            });
                    });
            }
        })
    );
})*/

//5. Routing/URL Parsing to pick the right strategies
//different strategies for different requests
//improved version of network with cache fallback strategy
//first get data from cache and then use network and update cache
self.addEventListener('fetch', function(event){
    //console.log('[SW] fetching...', event);
    //test url
    //var url = 'https://httpbin.org/post';
    //data url (firebase)
    var url = 'https://pwagram-5acb8.firebaseio.com/posts.json';
    //use different ctrategies for different requests
    if (event.request.url.indexOf(url) > -1) {
        //cache then network strategy
        console.log('cache then network for ' + url);
        event.respondWith(
            /*
            //Dynamic content (web data) is NOT stored inside cache api
            //!!!---- indexDB used instead----!!!!!!
            //cache
            caches.open(CACHE_DYNAMIC_NAME)
            .then(function(cache) {
                //network
                return fetch(event.request)
                    .then(function(res) {
                        //intercept all other requests
                        //clean cache
                        trimCache(CACHE_DYNAMIC_NAME, 55);
                        //override older data with the latest and store in cache
                        cache.put(event.request, res.clone());
                        return res;
                    })
            })
            */
            //store inside indexDB
            fetch(event.request)
                .then(function(res) {
                    //create response clone and transfrom into json
                    var clonedRes = res.clone();
                    //clear stored data before writing new
                    clearAllData('posts')
                        .then(function() {
                            return clonedRes.json();
                        })   
                        .then(function(data){
                            //pull out data keys and store
                            for (var key in data) {
                                console.log('store idb:' + key, data[key]);
                                writeData('posts', data[key])
                                    /*
                                    //delete item after insert
                                    //!!!!TEST ONLY!!!!!!
                                    //!!!otherwise dont make sense!!!!
                                    .then(function() {
                                        deleteItemFromData('posts', key);
                                    }
                                    */
                                ;
                            }
                        });
                    return res;
                })
        );
    //check if url contains any of the files from static files array
    //} else if (new RegExp('\\b' + STATIC_FILES.join('\\b|\\b') + '\\b').test(event.request.url)) {
    //check if url contains any of the files from static files array
    } else if (isInArray(event.request.url, STATIC_FILES)) {
        //cache only strategy - for static cache files ONLY!!
        console.log('cache only for static files during install');
        self.addEventListener('fetch', function(event){
            //console.log('[SW] fetching...', event);
            event.respondWith(
                caches.match(event.request)
            );
        });
    } else {
        //cache with network fallback strategy
        event.respondWith(
            //cache
            caches.match(event.request)
                .then(function(response){
                    console.log('[SW] fetching from cache and checking valid response...');
                    if (response) {
                        //fetch from cache
                        console.log('[SW] fetch from cache');
                        return response;
                    } else {
                        //fetch from network and add to cache
                        console.log('[SW] fetch from network and add to dynamic cache...');
                        return fetch(event.request)
                            .then(function(res){
                                //add this response to cache and return
                                return caches.open(CACHE_DYNAMIC_NAME)
                                    .then(function(cache) {
                                        //clean cache
                                        trimCache(CACHE_DYNAMIC_NAME, 55);
                                        cache.put(event.request.url, res.clone());
                                        return res;
                                    })
                            })
                            .catch(function(err){
                                //return offline page
                                return caches.open(CACHE_STATIC_NAME)
                                    .then(function(cache){
                                        //if (event.request.url.indexOf('/help') > -1) {
                                        //more flexible solution
                                        if (event.request.headers.get('accept').includes('text/html')) {
                                            return cache.match('/offline.html');
                                        }
                                        /*
                                        any type of file can be returned (image, css)
                                        default image, css... but must be precached in static array
                                         */
                                    });
                            });
                    }
            })
        );     
    }
});

//sync event listener
self.addEventListener('sync', function(event) {
    //gets triggered when connectivity is (re)established
    console.log('[SW] background syncing...', event);
    if (event.tag === 'sync-new-posts') {
        console.log('[SW] syncing new posts...');
        event.waitUntil(
            readAllData('sync-posts')
                .then(function(data) {
                    //loop through data
                    console.log('Loop dt for syncing...', data);
                    for (var dt of data) {
                        console.log('dt:', dt);
                        //form data
                        var postData = new FormData();
                        postData.append('id', dt.id);
                        postData.append('title', dt.title);
                        postData.append('location', dt.location);
                        postData.append('rawLocationLat', dt.rawLocation.lat);
                        postData.append('rawLocationLng', dt.rawLocation.lng);
                        postData.append('file', dt.picture, 'pwagram-' + dt.id + '.png');

                        //post request
                        //new url after deploying app to firebase
                        //fetch('https://pwagram-5acb8.firebaseio.com/posts.json', {
                        fetch('https://us-central1-pwagram-5acb8.cloudfunctions.net/storePostData', {
                            method: 'POST',
                            /* only for JSON data
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            //data object
                            body: JSON.stringify({
                                id: dt.id,
                                title: dt.title,
                                location: dt.location,
                                image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-5acb8.appspot.com/o/sf-boat.jpg?alt=media&token=93ac5acb-ba1b-4672-b850-7e8b6c029c5d'
                            })*/
                            //form data
                            body: postData
                        })
                        .then(function(res) {
                            console.log('Data sent...', res);
                            //clean items from sync-post idb object storage
                            if (res.ok) {
                                //use id from response
                                res.json()
                                    .then(function(resData) {
                                        console.log('deleting data after syncing', resData);
                                        //delete using id we got from the server
                                        deleteItemFromData('sync-posts', resData.id);
                                    });
                            }
                        })
                        .catch(function(err) {
                            console.log('Error while sending data', err);
                        });
                    }
                })
        );
    }
});

//notification click event listener
self.addEventListener('notificationclick', function(event){
    //gets triggered when notification is clicked
    //!!!!controlled by the OS, not by the browser!!!!
    console.log('[SW] notification clicked...', event);
    var notification = event.notification;
    var action = event.action;

    console.log('Notificationclick: ', notification);

    if (action === 'confirm') {
        console.log('Confirm was chosen!');
        //close notification
        notification.close();
    } else if (action === 'cancel') {
        console.log('Cancel was chosen!');
        //close notification
        notification.close();
    } else {
        console.log('Other action chosen:', action);
        //open page inside app
        event.waitUntil(
            clients.matchAll()
                .then(function(clis) {
                    //open visible windows where app runs
                    var client = clis.find(function(c) {
                        return c.visibilityState === 'visible';
                    });//find the first in the array
                    
                    //when notification is clicked
                    //we found already open window
                    if (client !== undefined) {
                        //test hardcoded url
                        //client.navigate('http://localhost:8080');
                        client.navigate(notification.data.url);
                        client.focus();u
                    } else {
                        //or open new window/tab
                        //test hardcoded url
                        //clients.openWindow('http://localhost:8080');
                        client.openWindow(notification.data.url);
                    }
                    //close notification
                    notification.close();
                })
        );
    }
});

//notification close event listener
self.addEventListener('notificationclose', function(event){
    //gets triggered when notification closed
    //!!!!controlled by the OS, not by the browser!!!!
    console.log('[SW] notification closed...', event);
});

//push listening event handler 
self.addEventListener('push', function(event) {
    //gets triggered when push message arrives
    console.log('[SW] push notification received...');
    
    //dummy data object
    var data = {
        title: 'New data',
        content: 'Something happened.',
        openUrl: '/'
    };

    //check if there is data from server
    if (event.data) {
        //extract data and assign to dummy data var
        data = JSON.parse(event.data.text());
    }

    var options = {
        body: data.content,
        icon: '/src/images/icons/app-icon-96x96.png',
        badge: '/src/images/icons/app-icon-96x96.png',
        data: {
            url: data.openUrl
        }
    };

    console.log('Displaying notification...');
    //display notification
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
