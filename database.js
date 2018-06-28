module.exports = {
    init: function() {
        initDatabase()
    },
    upsertMatch: function(match, callback) {
        upsertMatch(match, callback)
    },
    upsertUser: function(user, callback) {
        upsertUser(user, callback)
    },
    upsertBet: function(bet) {
        upsertBet(bet)
    },
    upsertTeam: function(team) {
        upsertTeam(team)
    },
    updateUserPoints: function(userId, points) {
        updateUserPoints(userId, points)
    },
    getTodaysMatches: function(callback) {
        getTodaysMatches(callback)
    },
    getTopUsers: function(numberOfUsers, callback) {
        getTopUsers(numberOfUsers, callback)
    },
    getFinishedMatches: function(callback) {
        getFinishedMatches(callback)
    },
    getBetableMatches: function(callback) {
        getBetableMatches(callback)
    },
    getBetableMatch: function(homeTeamCode, awayTeamCode, callback) {
        getBetableMatch(homeTeamCode, awayTeamCode, callback)
    },
    getUserBets: function(userId, callback) {
        getUserBets(userId, callback)
    },
    getBetsForMatch: function(homeTeamCode, awayTeamCode, callback) {
        getBetsForMatch(homeTeamCode, awayTeamCode, callback)
    },
    getCompletedBets: function(userId, callback) {
        getCompletedBets(userId, callback)
    },
    getAllUsers: function(callback) {
        getAllUsers(callback)
    },
    getUser: function(userId, callback) {
        getUser(userId, callback)
    }
};

// init sqlite db
var fs = require('fs');
var dbFile = './.data/sqlite.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);


function initDatabase() {
    // if ./.data/sqlite.db does not exist, create it, otherwise print records to console
    db.serialize(function() {
        if (!exists) {
            db.run('CREATE TABLE Teams (id TEXT PRIMARY KEY, name TEXT, code TEXT, flag TEXT)');
            console.log('New table Teams created!');

            db.run('CREATE TABLE Matches (id INTEGER PRIMARY KEY, homeTeamId TEXT, awayTeamId TEXT, homeResult INT, awayResult INT, homePenalty INT, awayPenalty INT, matchDate DATE, winner TEXT, finished BOOL)');
            console.log('New table Matches created!');

            db.run('CREATE TABLE Users (id TEXT PRIMARY KEY, fullName, points INT)');
            console.log('New table Users created!');

            db.run('CREATE TABLE Bets (id TEXT PRIMARY KEY, userId TEXT, matchId INT, homeResult INT, awayResult INT, winner TEXT)');
            console.log('New table Bets created!');
        } else {
            console.log('Database is ready to go!');
        }
    });
}

function upsertMatch(match, callback) {
    db.run('INSERT OR REPLACE INTO Matches VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [match.id, match.homeTeamId, match.awayTeamId, match.homeResult, match.awayResult, match.homePenalty, match.awayPentalty, match.matchDate, match.winner, match.finished], function(err) {
        if (err == null) {
            console.log(`Inserted match: ${match.id} ${match.homeTeamId}, ${match.awayTeamId}, ${match.homeResult}, ${match.awayResult}, ${match.homePenalty}, ${match.awayPentalty}, ${match.matchDate}, ${match.winner}, ${match.finished}`)
        } else {
            console.log(err)
        }
        callback()
    });
}

function upsertUser(user, callback) {
    db.run('INSERT OR REPLACE INTO Users VALUES(?, ?, ?)', [user.id, user.fullName, user.points], function(err) {
        if (err == null) {
            console.log(`Inserted user ${user.fullName}`)
            callback()
        } else {
            console.log(err)
        }
    });
}

function upsertBet(bet) {

    db.run('INSERT OR REPLACE INTO Bets(id, userId, matchId, homeResult, awayResult, winner) VALUES(?, ?, ?, ?, ?, ?)', [bet.userId + `${bet.matchId}`, bet.userId, bet.matchId, bet.homeResult, bet.awayResult, bet.winner], function(err) {
        if (err == null) {
            console.log(`Inserted bet for userId: ${bet.userId}`)
        } else {
            console.log(err)
        }
    });
}

function upsertTeam(team) {
    db.run('INSERT OR REPLACE INTO Teams VALUES(?, ?, ?, ?)', [team.id, team.name, team.code, team.flag], function(err) {
        if (err == null) {
            console.log(`Inserted team with name: ${team.name}`)
        } else {
            console.log(err)
        }
    });
}

function updateUserPoints(userId, points) {
    console.log("Updating points")
    db.run('UPDATE Users SET points = ? WHERE id = ?', [points, userId], function(err) {
        if (err == null) {
            console.log(`Updated points for user ${userId}`)
        } else {
            console.log(err)
        }
    });
}

function getTodaysMatches(callback) {

    var start = new Date();
    start.setHours(0, 0, 0, 0);

    var end = new Date();
    end.setHours(23, 59, 59, 999);


    db.all('SELECT m.id, m.matchDate, m.homeTeamId, m.awayTeamId, t1.flag as homeTeamFlag, t2.flag as awayTeamFlag, m.homeResult, m.awayResult, m.homePenalty, m.awayPenalty,' +
        't1.flag as homeFlag, t1.code as homeCode, ' +
        't2.code as awayCode, t2.flag as awayFlag ' +
        'FROM Matches m JOIN Teams t1 ON m.homeTeamId = t1.id JOIN Teams t2 ON m.awayTeamId = t2.id WHERE m.matchDate BETWEEN ? AND ? ORDER BY matchDate', [start, end],
        function(err, rows) {
            if (rows) {
                console.log(rows)
                callback(rows)
            } else if (err) {
                console.log(err)
            } else {
                console.log("what")
            }
        });
}

function getTopUsers(numberOfUsers, callback) {
    db.all('SELECT * FROM Users ORDER BY points DESC, fullName ASC LIMIT ?', [numberOfUsers], function(err, rows) {
        if (rows) {
            callback(rows)
        } else if (err) {
            console.log(err)
        } else {
            console.log("what")
        }
    });
}

function getBetableMatches(callback) {

    var minDate = new Date();
    console.log(minDate.toLocaleTimeString())
    minDate.setMinutes(minDate.getMinutes() + 5); // Max 5 min przed
    console.log(minDate.toLocaleTimeString())

    db.all('SELECT m.id, m.matchDate, m.homeResult, m.awayResult, ' +
        't1.code as homeTeamCode, t2.code as awayTeamCode, t1.flag as homeTeamFlag, t2.flag as awayTeamFlag FROM Matches m ' +
        'JOIN Teams t1 ON m.homeTeamId = t1.id JOIN Teams t2 ON m.awayTeamId = t2.id ' +
        'WHERE m.finished = 0 AND m.matchDate > ?' +
        'ORDER BY matchDate LIMIT 10 ', [minDate],
        function(err, rows) {
            if (rows) {
                console.log(rows)
                callback(rows)
            } else if (err) {
                console.log(err)
            } else {
                console.log("what")
            }
        });
}

function getBetableMatch(homeTeamCode, awayTeamCode, callback) {
    getBetableMatches(function(matches) {
        var result = matches.filter(match => match.homeTeamCode == homeTeamCode && match.awayTeamCode == awayTeamCode)
        callback(result[0])
    });
}

function getFinishedMatches(callback) {
    db.all('SELECT * FROM Matches WHERE finished = 1', function(err, rows) {
        if (rows) {
            callback(rows)
        } else {
            console.log(err)
        }
    });
}

function getUserBets(userId, callback) {
    db.all('SELECT b.homeResult, b.awayResult, b.winner, ' +
        't1.flag as homeFlag, t1.code as homeCode, ' +
        't2.code as awayCode, t2.flag as awayFlag, ' +
        'm.homeResult as finalHomeResult, m.awayResult as finalAwayResult, m.winner as finalWinner, m.finished ' +
        'FROM Bets b ' +
        'JOIN Matches m ON b.matchId = m.id JOIN Teams t1 ON m.homeTeamId = t1.id JOIN Teams t2 ON m.awayTeamId = t2.id ' +
        'WHERE b.userId = ? ORDER BY m.matchDate', [userId],
        function(err, rows) {
            if (rows) {
                console.log(rows)
                callback(rows)
            } else if (err) {
                console.log(err)
            } else {
                console.log("what")
            }
        });
}

function getBetsForMatch(homeTeamCode, awayTeamCode, callback) {

      db.all('SELECT m.id, t1.code as homeTeamCode, t2.code as awayTeamCode, t1.flag as homeTeamFlag, t2.flag as awayTeamFlag FROM Matches m ' +
        'JOIN Teams t1 ON m.homeTeamId = t1.id JOIN Teams t2 ON m.awayTeamId = t2.id WHERE t1.code = ? AND t2.code = ?', [homeTeamCode, awayTeamCode], function(err, rows) {
                if (rows) {
        if (!rows[0]) {
            callback([])
            return
        }

        db.all('SELECT b.homeResult, b.awayResult,' +
            't1.flag as homeFlag, t1.code as homeCode, ' +
            't2.code as awayCode, t2.flag as awayFlag ' +
            'FROM Bets b ' +
            'JOIN Matches m ON b.matchId = m.id JOIN Teams t1 ON m.homeTeamId = t1.id JOIN Teams t2 ON m.awayTeamId = t2.id ' +
            'WHERE b.matchId = ?', [rows[0].id],
            function(err, rows) {
                if (rows) {
                    console.log(rows)
                    callback(rows)
                } else if (err) {
                    console.log(err)
                } else {
                    console.log("what")
                }
            });




                } else if (err) {
                    console.log(err)
                } else {
                    console.log("what")
                }
            });

}

function getCompletedBets(userId, callback) {
    db.all('SELECT b.winner, b.homeResult, b.awayResult, ' +
        'm.homeResult as finalHomeResult, m.awayResult as finalAwayResult, m.winner as finalWinner ' +
        'FROM Bets b ' +
        'JOIN Matches m ON b.matchId = m.id ' +
        'WHERE b.userId = ? AND m.finished = 1', [userId],
        function(err, rows) {
            if (rows) {
                console.log(rows)
                callback(rows)
            } else if (err) {
                console.log(err)
            } else {
                console.log("what")
            }
        });
}

function getAllUsers(callback) {
    db.all('SELECT u.id, u.fullName FROM Users u JOIN Bets b ON b.userId = u.id GROUP BY u.id', function(err, rows) {
        if (rows) {
            console.log(rows)
            callback(rows)
        } else if (err) {
            console.log(err)
        } else {
            console.log("what")
        }
    });
}

function getUser(userId, callback) {
    db.all('SELECT * FROM Users WHERE id = ?', [userId], function(err, rows) {
        if (rows) {
            callback(rows)
        } else if (err) {
            console.log(err)
        } else {
            console.log("what")
        }
    });
}
