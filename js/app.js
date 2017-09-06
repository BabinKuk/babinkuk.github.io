/**
 * IIFE
 */
(function(){
    //format dates (yyyy-mm-dd)
    Date.prototype.yyyymmdd = function(){
        //month is 0 based, increment by 1
        let mm = this.getMonth() + 1;
        let dd = this.getDate();
        
        //return formatted date string formed from array elements
        return [this.getFullYear(),
                (mm>9 ? '' : '0') + mm,
                (dd>9 ? '' : '0') + dd
            ].join('-');
    };

    //date object woth formated start and end
    const dates = {
        startDate: function(){
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            //test return '2017-08-01'
            return startDate.yyyymmdd();
        },
        endDate: function(){
            const endDate = new Date();
            //test return'2017-08-31'
            return endDate.yyyymmdd();
        }
    };
    
    //apiURL
    // https://api.github.com/search/repositories?q=tetris+language:assembly&sort=stars&order=desc
    const app = {
        apiURL: `https://api.github.com/search/repositories?q=created%3A%22${dates.startDate()}+..+${dates.endDate()}%22%20language%3Ajavascript&sort=stars&order=desc`,
        cardTemplate: document.querySelector('.card-template')
    }

    // get data from url
    app.getTrends = function() {
        console.log('Fetch from github...');

        //caching strategy: Cache first, then Network
        let networkReturned = false;
        if('caches' in window) {
            caches.match(app.apiURL).then(function(response){
                //console.log('resp', response);
                if (response) {
                    response.json().then(function(trends){
                        console.log('From cache...');
                        if(!networkReturned){
                            app.updateTrends(trends);
                        }
                    });
                }
            });
        }

        fetch(app.apiURL)
        .then(response => response.json())
        .then(function(trends){
            console.log('From server...', trends);
            app.updateTrends(trends.items);
            networkReturned = true;
        })
        .catch(function(err){
            //Error
            console.log('Error:', err);
        });
    }

    //iterate over fetched data and build DOM template
    app.updateTrends = function(trends){
        console.log('Update trends...', trends);
        const trendsRow = document.querySelector('.trends');
        for(let i=0; i<trends.length; i++){
            const trend = trends[i];
            //create card element and append it to .trends dom element
            trendsRow.appendChild(app.createCard(trend));
        }
    }

    //create card dom element
    app.createCard = function(trend){
        //console.log('Creating card element...', trend);
        // clone card element and add data
        const card = app.cardTemplate.cloneNode(true);
        card.classList.remove('card-template');
        card.querySelector('.card-title').textContent = trend.full_name;
        card.querySelector('.card-lang').textContent = trend.language;
        card.querySelector('.card-stars').textContent = trend.stargazers_count;
        card.querySelector('.card-forks').textContent = trend.forks;
        card.querySelector('.card-link').setAttribute('href', trend.html_url);
        card.querySelector('.card-link').setAttribute('target', '_blank');
        return card;
    }

    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded');
        app.getTrends();

        //Event listener for refresh button
        const refreshButton = document.querySelector('.refresh');
        refreshButton.addEventListener('click', function(){
            console.log('Refresh...');
            app.getTrends();
        });
    });

    //register service worker code
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
        .register('/service-worker.js')
        .then(function() { 
            console.log('Service Worker Registered'); 
        });
    }
})()