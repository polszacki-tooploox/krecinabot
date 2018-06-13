# KrecinaBot

Slack bot that allows betting on World Cup 2018 matches. 

## Installation
I recommend using glitch.com hosting to host the bot and a database (node-sqlite example).

To add it to you Slack you have to:
1. Create a bot here: https://api.slack.com/apps/new. Remember to set correct permissions (I recommend testing it as I'm not sure which are required :P). 
2. Copy all required keys and ids from api.slack to .env file.

## Usage

To interact with a bot send a direct message to it.

`help` command will display the instructions:

`bet <MATCH> <SCORE>` - adds a bet, e.g. GER-FRA 2:0 ( \"-\" and \":\" are required)

`matches` - list of betable matches (next 10 matches), you can bet up to 15 min before the start of the match

`today` - list of today's matches

`top [NUMBER]` - current scores, shows top 10 users by default, pass a number to show more

`coupons [MATCH]` - list of your bets (with no arguments) or a list of coupons for a betable match, e.g. coupons POL-GER

## Notes
The bot was written for fun, sorry for the quality of the code. It probably doesn't look good as I'm not a javascript developer.

## License

MIT

Please see the [project license](LICENSE.md) for further details.
