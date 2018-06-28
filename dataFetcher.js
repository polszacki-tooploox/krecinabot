var request = require("request")
var database = require('./database');

module.exports = {
    fetchWithInterval: function(callback) {
        fetchWithInterval(callback)
    }
};


let interval = 60 * 1000 * 30 // 30m

function fetchWithInterval(callback) {
    console.log("Started fteching")
    var requestLoop = setInterval(function() {
        fetchJSON(callback);
    }, interval);
}

function fetchJSON(callback) {
    callback()
    request({
        url: "https://raw.githubusercontent.com/lsv/fifa-worldcup-2018/master/data.json",
        method: "GET",
        json: true,
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('sucess!');
            parseTeams(body)
            parseMatches(body, callback)
        } else {
            console.log('error' + response.statusCode);
        }
    });
}

function parseMatches(json, callback) {

    let groupAMatches = json.groups.a.matches
    let groupBMatches = json.groups.b.matches
    let groupCMatches = json.groups.c.matches
    let groupDMatches = json.groups.d.matches
    let groudEMatches = json.groups.e.matches
    let groudFMatches = json.groups.f.matches
    let groudGMatches = json.groups.g.matches
    let groudHMatches = json.groups.h.matches
    let round16Matches = json.knockout.round_16.matches
    let round8Matches = json.knockout.round_8.matches
    let round4Matches = json.knockout.round_4.matches
    let round2LoserMatches = json.knockout.round_2_loser.matches
    let round2Matches = json.knockout.round_2.matches

    let allMatches = groupAMatches.concat(groupBMatches, groupCMatches,
        groupDMatches, groudEMatches,
        groudFMatches, groudGMatches,
        groudHMatches, round16Matches,
        round8Matches, round4Matches,
        round2LoserMatches, round2Matches)

    var matchesCounter = allMatches.length

    for (var i = 0, len = allMatches.length; i < len; i++) {
        let match = allMatches[i]

        var mappedMatch = new Object()
        mappedMatch.id = match.name
        mappedMatch.homeTeamId = match.home_team
        mappedMatch.awayTeamId = match.away_team
        mappedMatch.homeResult = match.home_result
        mappedMatch.awayResult = match.away_result
        mappedMatch.homePenalty = match.home_penalty
        mappedMatch.awayPenalty = match.awayPenalty
        mappedMatch.matchDate = new Date(match.date)
        var winner = "home"
        if (match.home_result < match.away_result) {
          winner = "away"
        } else if (match.home_result == match.away_result){
          winner = null
        }
        mappedMatch.winner = winner
        mappedMatch.finished = match.finished

        database.upsertMatch(mappedMatch, function() {
            matchesCounter -= 1
            if (matchesCounter == 0) {
                callback()
            }
        })
    }
}

function parseTeams(json) {
    let teams = json.teams

    for (var i = 0, len = teams.length; i < len; i++) {
        let team = teams[i]

        var mappedTeam = new Object()
        mappedTeam.id = team.id
        mappedTeam.name = team.name
        mappedTeam.code = team.fifaCode
        mappedTeam.flag = team.emojiString
        database.upsertTeam(mappedTeam)
    }
}
