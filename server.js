// server.js
// where your node app starts
let betKey = "bet"
let matchesKey = "matches"
let todayKey = "today"
let topKey = "top"
let couponsKey = "coupons"
let helpKey = "help"
let maxPoints = 8
let minPoints = 3


// init project
var express = require('express');
var bodyParser = require('body-parser');
var dataFetcher = require('./dataFetcher');
var database = require('./database')
var app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.
database.init()

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
    response.sendFile(__dirname + '/views/index.html');
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
    console.log('Your app is listening on port ' + listener.address().port);
});


// request to self to wake up
var request = require("request")
app.listen(8080);
setInterval(() => {
    request({
        url: `http://${process.env.PROJECT_DOMAIN}.glitch.me/`,
        method: "GET"
    });
}, 280000);



require('dotenv').config();

const WebClient = require('@slack/client').WebClient;
const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;

// Retrieve bot token from dotenv file
const bot_token = process.env.SLACK_BOT_TOKEN || '';
// Authorization token
const auth_token = process.env.SLACK_AUTH_TOKEN || '';
// Verification token for Events Adapter
const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);

// Slack web client
const web = new WebClient(auth_token);
const bot = new WebClient(bot_token);

// The port we'll be using for our Express server
const PORT = 3000;

// The channel we'll send TalkBot messages to
const channel = '#krecina_test'

// Slack events client
app.use('/events', slackEvents.expressMiddleware());

slackEvents.on('message', (event) => {
    console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
    handleMessage(event.user, event.text, event.channel)
});


slackEvents.on('app_mention', (event) => {
    console.log(`Received a mention event: user ${event.user} in channel ${event.channel} says ${event.text}`);
    handleMessage(event.user, event.text, event.channel)
});

dataFetcher.fetchWithInterval(function() {
    updatePoints()
})

function handleMessage(user, text, channel) {
    if (!user) {
        return
    }

    if (text.includes(betKey)) {
        betAfterFetchingUser(user, text, channel)
    } else if (text.includes(matchesKey)) {
        listBetableMatches(channel)
    } else if (text.includes(todayKey)) {
        listTodayMatches(channel)
    } else if (text.includes(topKey)) {
        listTop(text, channel)
    } else if (text.includes(couponsKey)) {
        listCoupons(text, user, channel)
    } else if (text.includes(helpKey)) {
        showHelp(channel)
    }
}


function betAfterFetchingUser(user, text, channel) {
    database.getUser(user, function(savedUsers) {

        let betText = text.slice(text.indexOf(betKey) + betKey.length)
        if (savedUsers.length == 0) {
            bot.users.info({
                user: user
            }, function(err, info) {

                var newUser = new Object()
                newUser.id = user
                newUser.fullName = info.user.real_name
                newUser.points = 0
                database.upsertUser(newUser, function() {
                    saveBet(user, betText, channel)
                })
            })
        } else {
            saveBet(user, betText, channel)
        }
    })
}

function saveBet(user, betText, channel) {

    if (!(betText.includes("-") && betText.includes(":"))) {
        sendMessage("Didn't get that. Try this format: *<MECZ>|<WYNIK>* np. bet POL-GER|4:0", channel)
        return
    }

    var components = betText.match("[a-zA-Z]{3}-[a-zA-Z]{3}")
    var scores = betText.match("[0-9]?[0-9]:[0-9][0-9]?")
    if (scores && components) {
        var teams = components[0].split("-")
        var homeTeamCode = teams[0].trim().toUpperCase()
        var awayTeamCode = teams[1].trim().toUpperCase()
        scores = scores[0].split(":")
    } else {
        sendMessage("Didn't get that. Try this format: *<MECZ>|<WYNIK>* np. bet POL-GER|4:0", channel)
        return
    }
    var homeScore = scores[0].trim()
    var awayScore = scores[1].trim()

    console.log(`${homeTeamCode} ${homeScore} - ${awayScore} ${awayTeamCode}`)

    database.getBetableMatch(homeTeamCode, awayTeamCode, function(match) {
        var message = ""
        if (match) {
            console.log(match)
            var bet = new Object()
            bet.userId = user
            bet.matchId = match.id
            bet.homeResult = homeScore
            bet.awayResult = awayScore
            if (homeScore > awayScore) {
                bet.winner = "home"
            } else if (homeScore < awayScore) {
                bet.winner = "away"
            } else {
                bet.winner = null
            }
            database.upsertBet(bet)
            message = `Bet saved ${homeTeamCode}-${awayTeamCode} ${homeScore}:${awayScore}`

        } else {
            message = "I can't accept this bet"
        }
        sendMessage(message, channel)
    });

}

function listBetableMatches(channel) {
    database.getBetableMatches(function(matches) {
        let message = "I accept bets for this matches:"

        for (var i = 0, len = matches.length; i < len; i++) {
            let match = matches[i]
            if (match.homeResult) {
                message += `\n>${match.homeTeamFlag} ${match.homeTeamCode} ${match.homeResult} - ${match.awayResult} ${match.awayTeamCode} ${match.awayTeamFlag}    on ${new Date(match.matchDate).toDateString()}`
            } else {
                message += `\n>${match.homeTeamFlag} ${match.homeTeamCode} - ${match.awayTeamCode} ${match.awayTeamFlag}    ${new Date(match.matchDate).toDateString()} - ${new Date(match.matchDate).toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw' })}`
            }
        }
        sendMessage(message, channel)
    });
}

function listTodayMatches(channel) {
    database.getTodaysMatches(function(matches) {

        var message = "Today's matches:"

        if (matches.length == 0) {
            message = "There are not matches today :("
        }

        for (var i = 0, len = matches.length; i < len; i++) {
            let match = matches[i]
            if (match.homeResult) {
                message += `\n>${match.homeTeamFlag} ${match.homeCode} ${match.homeResult} - ${match.awayResult} ${match.awayCode} ${match.awayTeamFlag}`
            } else {
                message += `\n>${match.homeTeamFlag} ${match.homeCode} - ${match.awayCode} ${match.awayTeamFlag}`
            }
        }
        sendMessage(message, channel)
    })
}

function listTop(text, channel) {
    let message = "Top:"

    let topText = text.slice(text.indexOf(topKey) + topKey.length)
    var numberOfUsers = parseInt(topText.match("[0-9][0-9]?[0-9]?"))
    if (!numberOfUsers) {
        numberOfUsers = 10
    }

    database.getTopUsers(numberOfUsers, function(users) {

        for (var i = 0, len = users.length; i < len; i++) {
            let user = users[i]
            message += `\n>${i+1}. ${user.fullName} - ${user.points} pts`
        }

        sendMessage(message, channel)
    });
}

function listCoupons(text, user, channel) {

    let matchText = text.slice(text.indexOf("coupons") + "coupons".length)
    var components = matchText.match("[a-zA-Z]{3}-[a-zA-Z]{3}")
    if (components) {
        var teams = components[0].split("-")
        var homeTeamCode = teams[0].trim().toUpperCase()
        var awayTeamCode = teams[1].trim().toUpperCase()

        var message = "Bets for match " + homeTeamCode + "-" + awayTeamCode + ":"
        database.getBetsForMatch(homeTeamCode, awayTeamCode, function(bets) {

            if (bets.length == 0) {
                message = "> There are no bets for this match"
            }

            for (var i = 0, len = bets.length; i < len; i++) {
                let bet = bets[i]
                message += `\n>${bet.homeFlag} ${bet.homeCode} ${bet.homeResult} - ${bet.awayResult} ${bet.awayCode} ${bet.awayFlag}`
            }
            sendMessage(message, channel)
        });

    } else {
        listUsersCoupons(user, channel)
    }
}

function listUsersCoupons(user, channel) {
    var message = "Your bets:"
    database.getUserBets(user, function(bets) {

        if (bets.length == 0) {
            message = "> You have no bets"
        }

        for (var i = 0, len = bets.length; i < len; i++) {
            let bet = bets[i]
            message += `\n>${bet.homeFlag} ${bet.homeCode} ${bet.homeResult} - ${bet.awayResult} ${bet.awayCode} ${bet.awayFlag}`
        }
        sendMessage(message, channel)
    });
}

function showHelp(channel) {
    let helpMessage =
        "> *bet <MATCH> <SCORE>* - adds a bet, e.g. GER-FRA 2:0 ( \"-\" and \":\" are required)\n\
  > *matches* - list of betable matches (next 10 matches), you can bet up to 15 min before the start of the match\n\
  > *today* - list of today's matches\n\
  > *top [NUMBER]* - current scores, shows top 10 users by default, pass a number to show more\n\
  > *coupons [MATCH]* - list of your bets (with no arguments) or a list of coupons for a betable match, e.g. coupons POL-GER\
  "
    sendMessage(helpMessage, channel)
}

function sendMessage(text, channel) {
    // Send message using Slack Web Client
    bot.chat.postMessage({
            channel: channel,
            text: text,
            as_user: false
        })
        .catch(console.error);
}

function updatePoints() {

    database.getAllUsers(function(users) {

        for (var i = 0, len = users.length; i < len; i++) {
            let user = users[i]
            database.getCompletedBets(user.id, function(bets) {
                var points = 0

                for (var j = 0, len = bets.length; j < len; j++) {
                    let bet = bets[j]

                    if (bet.homeResult == bet.finalHomeResult && bet.awayResult == bet.finalAwayResult && bet.winner == bet.finalWinner) {
                        points += maxPoints
                    } else if (bet.winner == bet.finalWinner) {
                        points += minPoints
                    }
                }
                database.updateUserPoints(user.id, points)
            })
        }
    });
}
