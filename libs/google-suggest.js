const rp = require('request-promise');
const convert = require('xml-js');

let host = 'https://www.google.com';
let path = '/complete/search';
const hl = 'en';

let queryWordLength = 0;

let response_handler = body => {
    const body_ = convert.xml2json(body, { compact: true });
    const obj = JSON.parse(body_);

    const suggests = obj.toplevel.CompleteSuggestion;
    const res = [];
    suggests.forEach(suggest => {
        let words = suggest.suggestion._attributes.data;
        words = words.split(' ').slice(queryWordLength).join(' ');
        if (words.length > 0) {
            res.push(words);
        }
    });
    return res;
};

const get = (query = 'Trump') => {
    return new Promise((resolve, reject) => {
        queryWordLength = query.split(' ').length;
        query = encodeURIComponent(query);
        let params = '?hl=' + hl + '&q=' + query + '&output=toolbar';
        let request_params = {
            method: 'GET',
            uri: host + path + params
        };
        console.log(request_params);

        rp(request_params).then(res => {
            return response_handler(res);
        }).then(wordList => {
            resolve(wordList);
        });
    });
}

module.exports.get = get;