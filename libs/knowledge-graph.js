const rp = require('request-promise');

const API_KEY = 'AIzaSyBZnW9B5GXz_scnDpjODDI1wPdqpaww5ZQ';

const host = 'https://kgsearch.googleapis.com';
const path = '/v1/entities:search';
const params = '?query=' + '&key=' + API_KEY + '&limit=1&indent=True';

const mkt = 'en-US';

const response_handler = body => {
    let body_ = JSON.parse(body);
    let body__ = JSON.stringify(body_, null, '  ');
    let res = [];
    if (body_.itemListElement.length > 0) {
        const result = body_.itemListElement[0].result;
        res.push(result);
    };
    if (res.length > 0) return res;
};

const get = (query = 'Trump') => {
    return new Promise((resolve, reject) => {
        const params = '?query=' + query + '&key=' + API_KEY + '&limit=1&indent=True';
        const request_params = {
            method: 'GET',
            uri: host + path + params
        };

        rp(request_params).then(res => {
            return response_handler(res);
        }).then(wordList => {
            if (wordList) resolve(wordList);
        });
    });
}

module.exports.get = get;

// get('iphone').then(res => {
//     console.log(res);
// })