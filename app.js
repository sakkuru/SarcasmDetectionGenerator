require('dotenv').config();
const builder = require('botbuilder');
const restify = require('restify');
const bodyParser = require('body-parser');
const app = restify.createServer();

const suggest = require('./google-suggest');
const tagger = require('./treetagger');
const antonym = require('./antonym');
const kg = require('./knowledge-graph');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const targetWord = process.argv[2] || 'bing';
console.log('Word:', targetWord);
let targetName = '';

const suggestQuery = targetWord + ' is';
const queryLength = suggestQuery.split(' ').length;

const getAdverb = () => {
    const adverbList = ['extremely', 'awfully', 'quite', 'terrifically', 'terribly'];
    const min = 0;
    const max = adverbList.length - 1;
    const index = Math.floor(Math.random() * (max + 1 - min)) + min;
    return adverbList[index];
}

let typeOfWord;

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
                            });
                        });

                    }

                }
            });
        });
    });
});


//=========================================================
// Bot Setup
//=========================================================

const port = process.env.port || process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log('Server is listening on port %s', port);
});

// Create chat bot
const connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

const bot = new builder.UniversalBot(connector);

app.post('/api/messages', connector.listen());

app.get('/', (req, res) => {
    res.send(`Bot is running on port ${port}!\n`);
});

//=========================================================
// Tab Setup
//=========================================================

app.get('/\/tabs/.*/', restify.plugins.serveStatic({
    directory: __dirname,
    // default: './index.html'
}));

//=========================================================
// Bots Dialogs
//=========================================================

// default first dialog
bot.dialog('/', [
    session => {
        session.send("Hello! This is Saki's Bot.");
        session.beginDialog('Greeting');
    }
]);

bot.dialog('Greeting', [
    session => {
        session.send("Type something.");
    }
]);

// help command
bot.customAction({
    matches: /^help$/i,
    onSelectAction: (session, args, next) => {
        const helpTexts = [
            'help: This help menu. Previous dialog is still continues.',
            'exit: End the dialog and back to beginning dialog.',
        ]
        session.send(helpTexts.join('\n\n'));
    }
});

// exit command
bot.dialog('Exit', [
    session => {
        console.log(session.userData);
        session.endDialog("Bye.");
    },
]).triggerAction({
    matches: /^exit$/i
});

// Always accepts free text input
bot.dialog('Any', [
    (session, results) => {
        console.log('input:', results.intent.matched.input);
        session.send("Your input: %s", results.intent.matched.input);
    },
]).triggerAction({
    matches: /^.*$/i
});