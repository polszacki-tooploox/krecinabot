/**
 * Dependencies:
 * Dotenv, Express, BodyParser, Slack Web Client, Slack Events API
 */

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const WebClient = require('@slack/client').WebClient;
const createSlackEventAdapter = require('@slack/events-api').createSlackEventAdapter;

// Retrieve bot token from dotenv file
const bot_token = process.env.SLACK_BOT_TOKEN || '';
// Authorization token
const auth_token = process.env.SLACK_AUTH_TOKEN || '';
// Verification token for Events Adapter
const slackEvents = createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);

// Creates our express app
const app = express();
// Use BodyParser for app
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
// Slack web client
const web = new WebClient(auth_token);
const bot = new WebClient(bot_token);

// The port we'll be using for our Express server
const PORT = 4390;

// The channel we'll send TalkBot messages to
const channel = '#krecina_test'

// Starts our server
app.listen(PORT, function() {
	console.log('TalkBot is listening on port ' + PORT);
});

// Slack events client
app.use('/events', slackEvents.expressMiddleware());

slackEvents.on('message', (event)=> {
  console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
	handleMessage(event.user, event.text, event.channel)
});


slackEvents.on('app_mention', (event)=> {
  console.log(`Received a mention event: user ${event.user} in channel ${event.channel} says ${event.text}`);
	handleMessage(event.user, event.text, event.channel)
});

function handleMessage(user, text, channel) {

	if (text.includes("bet")) {
		console.log(`Typowanie`)
		let betText = text.slice(text.indexOf("bet") + "bet".length)
		console.log(betText)
		saveBet(user, betText, channel)
	} else if (text.includes("matches")) {
		console.log(`Listuje mecze`)
		listBetableMatches(channel)
	} else if (text.includes("today")) {
		console.log(`Listuje dzisiejsze mecze`)
		listTodayMatches(channel)
	} else if (text.includes("top")) {
		console.log(`Lista wyników`)
		listTop(channel)
	} else if (text.includes("coupons")) {
		console.log(`Listuje moje zakłady`)
		listCoupons(user, channel)
	} else if (text.includes("help")) {
		showHelp(channel)
	}
}

function saveBet(user, betText, channel) {
	var components = betText.split("|")
	var teams = components[0]
	var scores = components[1]

	console.log(`Typuje mecz ${teams} na wynik ${scores}`)
}

function listBetableMatches(channel) {

}

function listTodayMatches(channel) {

}

function listTop(channel) {
	let list = "Current scores:\n1. John Doe - 30 points\n2. Someone Else - 21 points\n3. Test Dude - 20 points\n4. Another One - 15 points"
	sendMessage(list, channel)
}

function listCoupons(user, channel) {

}

function showHelp(channel) {
	let helpMessage =
	"
	*bet <MATCH>|<SCORE>* - place a new bet (e.g. bet POL-GER|4:0)\n \
	*matches* - list all betable matches\n \
	*today* - list today's matches\n\
	*top* - show current score\n\
	*coupons* - show my bets\
	"
	sendMessage(helpMessage, channel)
}

function sendMessage(text, channel) {
	// Send message using Slack Web Client
	console.log(channel)
	web.chat.postMessage({ channel: channel, text: text })
  .catch(console.error);
}
