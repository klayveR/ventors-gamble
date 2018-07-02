var auto = false;
var autoFast = false;
var divinesUsed = 0;
var maxed = 0;
var historyEntries = 10;
var timeout;
var colors = true;
var modMode = false;
var historyEnabled = true;
var warningModal;

var statistics = [0, 0, 0, 0, 0, 0];
var rollHistory = []
var rolls = [0, 0, 0, 0, 0, 0];
var rollPercentages = [0, 0, 0, 0, 0, 0];
var rollIDs = ["life", "iiq", "iir", "fire", "cold", "light"];
var possibilities = [0, 0, 0, 0, 0, 0];
var ranges = [
    [0, 60],
    [-10, 10],
    [-40, 40],
    [-25, 50],
    [-25, 50],
    [-25, 50]
];

// Roll the item and display the stats
function roll(increaseDivineCount = true, ui = true, updateHistory = true) {
    if (increaseDivineCount) divinesUsed++;

    // Copy previous rolls
    var previousRolls = rolls.slice(0);

    // This loop is to prevent the same outcome from a divine. A divine has to change at least on modifier value
    while (rolls.equals(previousRolls)) {
        for (var i = 0; i < rolls.length; i++) {
            rolls[i] = randomInt(ranges[i][0], ranges[i][1]);
        }
    }

    maxed = getMaxed();

    if(maxed <= 10) statistics[5]++;
    if(maxed <= 25) statistics[4]++;
    if(maxed <= 50 ) statistics[3]++;
    if(maxed >= 50) statistics[2]++;
    if(maxed >= 75) statistics[1]++;
    if(maxed >= 90) statistics[0]++;

    if(auto) {
        if((modMode && (rolls[0] >= $("#lifeRollSlider").slider("value") &&
                rolls[1] >= $("#iiqRollSlider").slider("value") &&
                rolls[2] >= $("#iirRollSlider").slider("value") &&
                rolls[3] >= $("#fireRollSlider").slider("value") &&
                rolls[4] >= $("#coldRollSlider").slider("value") &&
                rolls[5] >= $("#lightRollSlider").slider("value"))) ||
            (!modMode && maxed >= $("#targetSlider").slider("value"))) {
            gotRoll();
        }
    }

    if(updateHistory) addHistory();
    if(ui) updateUI();
}

function addHistory() {
    var stats = [maxed, divinesUsed, rolls.slice(0), rollPercentages.slice(0)];
    var added = false;

    // If history is empty, add stats as first history entry
    if (rollHistory.length === 0) {
        added = true;
        rollHistory.push(stats);
    } else {
        // Iterate through history, check if history entry has a lower roll, if yes add the new entry at that position
        for (var i = 0; i < rollHistory.length; i++) {
            if (rollHistory[i][0] < maxed) {
                rollHistory.splice(i, 0, stats);
                added = true;
                break;
            }
        }

        // If the entry hasn't been added yet, put it at the end anyways, it'll be removed if there are too many entries
        if (!added) {
            added = true;
            rollHistory.push(stats);
        }

        // if there are more than x history entries, remove the last one
        if (rollHistory.length > historyEntries) {
            rollHistory.pop();
        }
    }

    if (added && !autoFast) updateHistory();
}

// Stop automatic rolling function + re-enable buttons/sliders
function stopAutoRoll() {
    auto = false;
    clearInterval(timeout);

    $("#rollButton").prop("disabled", false);
    $("#resetButton").prop("disabled", false);
    $("#startAutoRollButton").show();
    $("#startAutoRollFastButton").show();
    $("#stopAutoRollButton").hide();

    $("#targetSlider").slider("enable");
    $("#speedSlider").slider("enable");
}

// Got the desired outcome by auto rolling
function gotRoll() {
    var timeout = 0;
    if(warningModal !== undefined) {
        warningModal.close();
        timeout = 250;
    }
    stopAutoRoll();
    updateUI();
    updateHistory();

    setTimeout(function() {
        $.sweetModal({
            icon: $.sweetModal.ICON_SUCCESS,
            timeout: 1200,
            theme: $.sweetModal.THEME_DARK,
            width: "300px",
            showCloseButton: false
        });
    }, timeout);
}

// Start the automatic rolling function with a delay after each roll + show stats + disable buttons/sliders
function rollAuto() {
    $("#rollButton").prop("disabled", true);
    $("#resetButton").prop("disabled", true);
    $("#startAutoRollButton").hide();
    $("#startAutoRollFastButton").hide();
    $("#stopAutoRollButton").show();

    $("#targetSlider").slider("disable");
    $("#speedSlider").slider("disable");

    auto = true;
    timeout = setInterval(function() {roll(true, true, historyEnabled)}, $("#speedSlider").slider("value"));
}

// Start the automatic rolling function without displaying stats after each roll
function rollAutoFast() {
    auto = false;
    autoFast = true;

    if($("#targetSlider").slider("value") >= 92 || modMode) {
        warningModal = $.sweetModal({
            title: 'This will take a while...',
            content: "<p>Rolling...</p><p>High target percentages or mod mode can cause lag. You can't interact with this tab during fast auto-roll</p>",
            icon: $.sweetModal.ICON_WARNING,
            theme: $.sweetModal.THEME_DARK,
            width: "500px",
            showCloseButton: false
        });

        setTimeout(startAutoFast, 250);
    } else {
        startAutoFast();
    }
}

function startAutoFast() {
    roll(true, false, historyEnabled);

    while (!(modMode && (rolls[0] >= $("#lifeRollSlider").slider("value") &&
        rolls[1] >= $("#iiqRollSlider").slider("value") &&
        rolls[2] >= $("#iirRollSlider").slider("value") &&
        rolls[3] >= $("#fireRollSlider").slider("value") &&
        rolls[4] >= $("#coldRollSlider").slider("value") &&
        rolls[5] >= $("#lightRollSlider").slider("value"))) &&
    !(!modMode && maxed >= $("#targetSlider").slider("value"))) {
        roll(true, false, historyEnabled);
    }

    gotRoll();
    autoFast = false;
}

// Update the values
function updateUI() {
    for (var i = 0; i < rolls.length; i++) {
        if (colors) {
            var colours = [new Colour('#ed4046'), new Colour('#bbbd2c'), new Colour('#4fc900')];
            $("#mod_" + rollIDs[i]).css("color", percent(rollPercentages[i], colours).hex);
        } else {
            $("#mod_" + rollIDs[i]).css("color", "grey");
        }

        $("#roll_" + rollIDs[i]).html(rolls[i]);
        $("#mod_" + rollIDs[i]).show();
    }

    $("#maxed").html(maxed.toFixed(2));
    $("#divinesUsed").html(divinesUsed);

    if(modMode) {
        $(".modModeSlider").show();
        $(".normalModeSlider").hide();
    } else {
        $(".modModeSlider").hide();
        $(".normalModeSlider").show();
    }

    // Update statistics
    for (var i = 0; i < statistics.length; i++) {
        if(statistics[i] > 0) {
            $("#statistics" + i).html(((statistics[i] / divinesUsed) * 100).toFixed(2) + "%");
        } else {
            $("#statistics" + i).html("0.00%");
        }
    }

    if (divinesUsed > 0) {
        $("#unid").hide();
        $("#resetButton").show();
        $(".mod").show();
    } else {
        $("#unid").show();
        $(".mod").hide();
        $("#maxed").html(0.00);
        $("#resetButton").hide();
    }
}

// Update the history table
function updateHistory() {
    $('#history > tbody > tr').remove();

    for (var i = 0; i < rollHistory.length; i++) {
        $('#history > tbody:last-child').append("<tr></tr>");

        // % maxed cell
        $('#history > tbody:last-child > tr:last-child').append("<td class='small grey'>" + rollHistory[i][0].toFixed(2) + "%</td>");

        // Iterate through each roll
        for (var j = 0; j < rollHistory[i][2].length; j++) {
            // Add roll as cell
            if(rollIDs[j] !== "life") {
                $('#history > tbody:last-child > tr:last-child').append("<td class='mod small'>" + rollHistory[i][2][j] + "%</td>");
            } else {
                $('#history > tbody:last-child > tr:last-child').append("<td class='mod small'>" + rollHistory[i][2][j] + "</td>");
            }

            // Add color classes if enabled
            if (colors) {
                var colours = [new Colour('#ed4046'), new Colour('#bbbd2c'), new Colour('#4fc900')];
                $('#history > tbody:last-child > tr:last-child > td:last-child').css("color", percent(rollHistory[i][3][j], colours).hex);
            } else {
                $('#history > tbody:last-child > tr:last-child > td:last-child').css("color", "grey");
            }
        }

        // Add divine # cell
        $('#history > tbody:last-child > tr:last-child').append("<td class='grey small'>" + rollHistory[i][1] + "</td>");
    }
}

function toggleColors() {
    colors = !colors;

    if (colors) {
        $("#colorButton").html("Disable colors");
    } else {
        $("#colorButton").html("Enable colors");
    }

    updateUI();
    updateHistory();
}

function toggleHistory() {
    historyEnabled = !historyEnabled;

    if (historyEnabled) {
        $("#historyButton").html("Disable history");
    } else {
        $("#historyButton").html("Enable history");
    }
}

function toggleMode() {
    modMode = !modMode;

    if (modMode) {
        $("#modeButton").html("Switch to normal mode");
        $("#autoRollInfo").hide();
    } else {
        $("#modeButton").html("Switch to individual mod mode");
        $("#autoRollInfo").show();
    }

    updateUI();
    updateHistory();
}

// Reset divines and update
function resetVentors() {
    if (divinesUsed > 0) {
        rolls = [0, 0, 0, 0, 0, 0];
        statistics = [0, 0, 0, 0, 0, 0];
        rollHistory = []
        divinesUsed = 0;
        updateUI();
        updateHistory();
    }
}

// Get the total % of how maxed out the rolls are
function getMaxed() {
    var percentage = 0.0;
    for (var i = 0; i < rolls.length; i++) {
        var pos = rolls[i] + Math.abs(ranges[i][0]);
        var rollPerc = (pos / possibilities[i]) * 100;
        rollPercentages[i] = rollPerc;
        percentage += rollPerc;
    }

    return percentage / rolls.length;
}

// Calculate the amount of choices for each roll
function calcPossibilities() {
    for (var j = 0; j < ranges.length; j++) {
        var choices = 0;
        for (var i = ranges[j][0]; i <= ranges[j][1]; i++) {
            choices++;
        }

        possibilities[j] = choices;
    }
}

// https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript/14853974
// Warn if overriding existing method
if (Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");

// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

function updateSpeedSliderValue(value) {
    var speedHandle = $("#speedValue");

    if (value > 100) {
        speedHandle.text((value / 1000).toFixed(2) + "s");
    } else {
        speedHandle.text(value + "ms");
    }
}

// Slider stuff
$(function () {
    calcPossibilities();
    updateUI();

    var targetHandle = $("#targetPercentage");
    $("#targetSlider").slider({
        min: 60,
        max: 100,
        value: 75,
        create: function () {
            targetHandle.text($(this).slider("value") + "%");
        },
        slide: function (event, ui) {
            targetHandle.text(ui.value + "%");

            if (!modMode) {
                if (ui.value >= 93) {
                    $("#autoRollInfo").html("At " + ui.value + "% fast auto-roll is very likely to freeze this tab for a long time.").show();
                } else if (ui.value >= 90) {
                    $("#autoRollInfo").html("At " + ui.value + "% fast auto-roll can cause massive lag.").show();
                } else if (ui.value >= 86) {
                    $("#autoRollInfo").html("At " + ui.value + "% fast auto-roll can cause lag.").show();
                } else {
                    $("#autoRollInfo").html("").hide();
                }
            }
        }
    });

    $("#speedSlider").slider({
        min: 15,
        max: 1000,
        value: 300,
        create: function () {
            updateSpeedSliderValue($(this).slider("value"));
        },
        slide: function (event, ui) {
            updateSpeedSliderValue(ui.value)
        }
    });

    var lifeRollHandle = $("#lifeRollValue");
    $("#lifeRollSlider").slider({
        min: ranges[0][0],
        max: ranges[0][1],
        create: function () {
            lifeRollHandle.text($(this).slider("value"));
        },
        slide: function (event, ui) {
            lifeRollHandle.text(ui.value);
        }
    });

    var iiqRollHandle = $("#iiqRollValue");
    $("#iiqRollSlider").slider({
        min: ranges[1][0],
        max: ranges[1][1],
        create: function () {
            iiqRollHandle.text($(this).slider("value") + "%");
        },
        slide: function (event, ui) {
            iiqRollHandle.text(ui.value + "%");
        }
    });

    var iirRollHandle = $("#iirRollValue");
    $("#iirRollSlider").slider({
        min: ranges[2][0],
        max: ranges[2][1],
        create: function () {
            iirRollHandle.text($(this).slider("value") + "%");
        },
        slide: function (event, ui) {
            iirRollHandle.text(ui.value + "%");
        }
    });

    var fireRollHandle = $("#fireRollValue");
    $("#fireRollSlider").slider({
        min: ranges[3][0],
        max: ranges[3][1],
        create: function () {
            fireRollHandle.text($(this).slider("value") + "%");
        },
        slide: function (event, ui) {
            fireRollHandle.text(ui.value + "%");
        }
    });

    var coldRollHandle = $("#coldRollValue");
    $("#coldRollSlider").slider({
        min: ranges[4][0],
        max: ranges[4][1],
        create: function () {
            coldRollHandle.text($(this).slider("value") + "%");
        },
        slide: function (event, ui) {
            coldRollHandle.text(ui.value + "%");
        }
    });

    var lightRollHandle = $("#lightRollValue");
    $("#lightRollSlider").slider({
        min: ranges[4][0],
        max: ranges[4][1],
        create: function () {
            lightRollHandle.text($(this).slider("value") + "%");
        },
        slide: function (event, ui) {
            lightRollHandle.text(ui.value + "%");
        }
    });
});