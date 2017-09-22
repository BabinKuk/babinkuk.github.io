/**
 * utility indexDB functions 
 */
//open indexDb
var dbPromise = idb.open('posts-store', 1, function(db) {
    //create objectStore if not exist
    //posts - for caching
    if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', {keyPath: 'id'});
    }
    //sync-posts - for sync tasks
    if (!db.objectStoreNames.contains('sync-posts')) {
        db.createObjectStore('sync-posts', {keyPath: 'id'});
    }
});

//write data into indexDb
function writeData(st, data) {
    console.log('Write data into idb...');
    return dbPromise
        .then(function(db){
            //create transaction, store obj and put inside
            var tx = db.transaction(st, 'readwrite');
            var store = tx.objectStore(st);
            store.put(data);
            return tx.complete;
        });
}

//get data from indexDb
function readAllData(st) {
    console.log('Read all data from idb...');
    return dbPromise
        .then(function(db) {
            //create transaction, store obj and get data
            var tx = db.transaction(st, 'readonly');
            var store = tx.objectStore(st);
            return store.getAll();
        });
}

//clear all data from indexDb
function clearAllData(st) {
    console.log('Clear all data from idb...');
    return dbPromise
        .then(function(db) {
            //create transaction, store obj and clear
            var tx = db.transaction(st, 'readwrite');
            var store = tx.objectStore(st);
            store.clear();
            return tx.complete;
        })
        .then(function() {
            console.log('Items deleted...');
        });
}

//delete item from indexDb
function deleteItemFromData(st, id) {
    console.log('Delete item from idb...');
    return dbPromise
        .then(function(db) {
            //create transaction, store obj and clear
            var tx = db.transaction(st, 'readwrite');
            var store = tx.objectStore(st);
            store.delete(id);
            return tx.complete;
        })
        .then(function() {
            console.log('Item ' + id + ' deleted');
        });
}

//convert url64 string into array of Uint values
function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
  
    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

//convert dataURI to file
function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], {type: mimeString});
return blob;
}