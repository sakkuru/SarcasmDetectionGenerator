const rp = require('request-promise');

let subscriptionKey = 'c8afd6aec5a845a4aaf9ff2b7c90ef12';

let host = 'https://api.cognitive.microsoft.com';
let path = '/bing/v7.0/Suggestions';

let mkt = 'en-US';

let queryWordLength = 0;

let response_handler = body => {
    const body_ = JSON.parse(body);

    const suggests = body_.suggestionGroups[0].searchSuggestions;
    const res = [];
    suggests.forEach(suggest => {
        let words = suggest.query.split(' ').slice(queryWordLength).join(' ');
        if (words.length > 0) {
            res.push(words);
        }
    });
    return res;
};

const get = (query = 'Trump') => {
    return new Promise((resolve, reject) => {
        queryWordLength = query.split(' ').length;
        query = query.split(' ').join('+');
        let params = '?mkt=' + mkt + '&q=' + query;
        let request_params = {
            method: 'GET',
            uri: host + path + params,
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
            }
        };

        rp(request_params).then(res => {
            return response_handler(res);
        }).then(wordList => {
            resolve(wordList);
        });
    });
}

module.exports.get = get;