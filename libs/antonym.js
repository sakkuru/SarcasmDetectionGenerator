const rp = require('request-promise');
var htmlparser = require("htmlparser2");

const host = 'http://www.thesaurus.com/';

const response_handler = body => {
    let parsedWords = [];
    var parser = new htmlparser.Parser({
        ontext: function(text) {
            if (1 < text.length && text.length < 50) {
                if (text.slice(0, 1) !== '\n' && text.slice(0, 2) !== '\r\n') {
                    parsedWords.push(text.trim());

                }
            }
        }
    }, { decodeEntities: true });
    parser.write(body);
    parser.end();
    // console.log(parsedWords);
    if (parsedWords.indexOf('Antonyms') < 0) {
        return [];
    }
    const anatonymsIndex = parsedWords.indexOf('Antonyms') + 2;
    let anatonymsEndIndex = parsedWords.indexOf('Cite This Source');
    if (parsedWords.indexOf('Cite This Source') < 0) {
        anatonymsEndIndex = anatonymsIndex + 10
    }
    // console.log(anatonymsIndex, anatonymsEndIndex);
    for (let i = anatonymsIndex; i < anatonymsEndIndex; i++) {
        // console.log(parsedWords[i]);
    }
    return parsedWords.slice(anatonymsIndex, anatonymsEndIndex);

};

const get = (query = 'sunny') => {
    console.log('Query:', query);
    const path = '/browse/' + query;
    return new Promise((resolve, reject) => {
        const request_params = {
            method: 'GET',
            uri: host + path
        };
        rp(request_params).then(res => {
            return response_handler(res);
        }).then(wordList => {
            // console.log(wordList);
            if (wordList) resolve(wordList);
        });
    });
}

module.exports.get = get;

// get('sunny');