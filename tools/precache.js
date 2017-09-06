const name = 'scotchPWA-v3'
module.exports = {
    //array of patterns to be cached
    staticFileGlobs: [
        './index.html',
        './images/*.{png,svg,gif,jpg}',
        './fonts/*.{woff,woff2}',
        './js/*.js',
        './css/*.css',
        'https://fonts.googleapis.com/icon?family=Material+Icons'
    ],
    stripPrefix: '.',
    //runtime caching, not the appshell, but content that the user will consume
    runtimeCaching: [{
        urlPattern: /https:\/\/api\.github\.com\/search\/repositories/,
        handler: 'networkFirst',
        options: {
            cache: {
                name: name
            }
        }
    }]
};