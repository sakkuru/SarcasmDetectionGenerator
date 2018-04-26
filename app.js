require('dotenv').config();
const restify = require('restify');
const bodyParser = require('body-parser');
const app = restify.createServer();

const suggest = require('./libs/google-suggest');
const tagger = require('./libs/treetagger');
const antonym = require('./libs/antonym');
const kg = require('./libs/knowledge-graph');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let defaultTargetWord = "trump";

const getAdverb = () => {
    const adverbList = ['extremely', 'awfully', 'quite', 'terrifically', 'terribly'];
    const min = 0;
    const max = adverbList.length - 1;
    const index = Math.floor(Math.random() * (max + 1 - min)) + min;
    return adverbList[index];
}

let typeOfWord;

const getSarcasmSentences = (targetWord = defaultTargetWord) => {
    let sarcasmSentenceList = [];
    console.log('Word:', targetWord);
    const suggestQuery = targetWord + ' is';
    const queryLength = suggestQuery.split(' ').length;
    return new Promise((resolve, reject) => {
        kg.get(targetWord).then(knowledges => {
            knowledges.forEach(knowledge => {
                console.log(targetWord, ":", knowledge.name, ":", knowledge.description);
                const desc = knowledge.description.toLowerCase();
                const type = knowledge['@type'].map(t => {
                    return t.toLowerCase();
                });
                if (desc.includes('president')) {
                    typeOfWord = 'president';
                } else if (desc.includes('food')) {
                    typeOfWord = 'food';
                } else if (desc.includes('animal')) {
                    typeOfWord = 'animal';
                } else if (type.includes('person')) {
                    typeOfWord = 'person';
                } else if (type.includes('city')) {
                    typeOfWord = 'city';
                } else if (type.includes('restaurant')) {
                    typeOfWord = 'restaurant';
                } else if (type.includes('corporation')) {
                    typeOfWord = 'corporation';
                }
            });
            console.log('type:', typeOfWord);
            return typeOfWord;
        }).then(type => {
            suggest.get(suggestQuery).then(suggests => {
                console.log(targetWord + '\'s related words: ', suggests.join(', '));
                suggests.forEach(suggest => {
                    let defaultSentence = suggestQuery + " " + suggest;
                    console.log('*', defaultSentence);
                    tagger.get(defaultSentence).then(tagged => {
                        for (let i = queryLength - 1; i < tagged.length; i++) {
                            if (tagged[i].pos == 'JJ') {
                                antonym.get(tagged[i].l).then(anatonyms => {
                                    anatonyms.forEach(a => {
                                        let splitted = defaultSentence.split(' ');
                                        splitted[i] = a;
                                        splitted.splice(i, 0, getAdverb());
                                        if (type) {
                                            splitted.push(type);
                                        }
                                        let sarcasmSentence = splitted.join(' ');
                                        // console.log(splitted)
                                        console.log(sarcasmSentence);
                                        sarcasmSentenceList.push(sarcasmSentence);
                                    });
                                    resolve(sarcasmSentenceList);
                                });
                            }
                        }
                    });
                });
            });
        });
    });
};


//=========================================================
// Bot Setup
//=========================================================

const port = process.env.port || process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log('Server is listening on port %s', port);
});

app.get('/:word', (req, res) => {
    getSarcasmSentences(req.params.word).then(list => {
        res.send(list);
    });
});