const TreeTagger = require('treetagger');
const tagger = new TreeTagger();

const tag = text => {
    if (!text) return;
    return new Promise((resolve, reject) => {
        tagger.tag(text, (err, results) => {
            // console.log(results);
            resolve(results);
        });
    });
}

const getWords = text => {
    if (!text) return;
    tag(text).then(results => {
        results.forEach(res => {
            console.log(res.pos);
        });
    });

}

module.exports.get = tag;

// getWords(process.argv[2]);