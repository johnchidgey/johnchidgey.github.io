/*! jjp.js
 *
 * John's jPlayer v0.1 - Soundbite NodeJS Server Demo Application
 *
 * 3 July, 2022 - John Chidgey
 *
 * Additional functionality for the jPlayer WebPlayer
 * Developed specifically for Soundbite functionality
 */

// TBD: Rules check all scenarios for logic - Set Start, End, Duration, all combinations and limits
/* DATA FORMAT
"startTime" : "1234.5",
"duration" : "42.25",
"title" : "Why the Podcast Namespace Matters",
"url" : "https://somewhere.hostingplace.com/ashow/E001-anEpisode.mp3",
{
  "name" : "A Soundbiter",
  "type" : "node",
  "address" : "02d5c1bf8b940dc9cadca86d1b0a3c37fbe39cee4c7e839e33bef9174531d27f52",
  "customKey" : "[optional key to pass(mixed)]",
  "customValue" : "[optional value to pass(mixed)]"
*/

const skipDuration = 5; // seconds
const maximumSoundbiteLength = 120; // 2 minute (120 second) maximum
const minimumSoundbiteLength = 5; // 5 second minimum
const totalSoundbitePlayers = 10; // 10 maximum limit for a Manage Sound Bite page
const podcastFullArray = [{podcast:"Select a TEN Show", feed:""},
                      {podcast:"Causality", feed:"https://engineered.network/causality/feed/index.xml"},
                      {podcast:"Pragmatic", feed:"https://engineered.network/pragmatic/feed/index.xml"},
                      {podcast:"Analytical", feed:"https://engineered.network/analytical/feed/index.xml"},
                      {podcast:"Neutrium", feed:"https://engineered.network/neutrium/feed/index.xml"},
                      {podcast:"Addenda", feed:"https://engineered.network/archived/addenda/feed/index.xml"},
                      {podcast:"Tangential", feed:"https://engineered.network/archived/tangential/feed/index.xml"},
                      {podcast:"The Exastential Podcast", feed:"https://engineered.network/archived/exastential/feed/index.xml"}];

var items = [];
var audioloaded = [false, false, false, false, false, false, false, false, false, false]; // number of entries must match CONST totalSoundbitePlayers
var soundbite = [{startTime:"", duration:"", title:"", url:"", name:"", type:"", address:"", customKey:"", customValue:""}];
var currentPlayheadTime = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // number of entries must match CONST totalSoundbitePlayers
var currentlyPlaying = [false, false, false, false, false, false, false, false, false, false]; // number of entries must match CONST totalSoundbitePlayers
var testPlaying = [false, false, false, false, false, false, false, false, false, false]; // number of entries must match CONST totalSoundbitePlayers
var episodeLength = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]; // number of entries must match CONST totalSoundbitePlayers
var podcastArray = [];
var playerObjectArray = [];
var controlObjectArray = [];

// RSS XML Tags to extract: itunes:episode OR podcast:episode; title OR itunes:title; podcast:soundbites; items.push({'id':5}); 1996-10-15T00:05:32.000Z
function checkHMSFormat(hmsString) {
  var hmsStringSegments = hmsString.match(/:/g).length;
  if (hmsStringSegments == 2) {
    var hmsStringArray = hmsString.split(':');
    var isValidHMS = true;
    hmsStringArray.forEach((hmsPart, index, fullArray) => {
      var result = Number(hmsPart);
      if (isNaN(result)) {
        if (isValidHMS)
          isValidHMS = false;
      }
    });
    return isValidHMS;
  }
  else
    return false;
}


function checkSecondsFormat(secondsString) {
  var result = Number(secondsString);
  var isValidSeconds = true;
  if (isNaN(result))
    isValidSeconds = false;
  return isValidSeconds;
}


function hmsToSeconds(hmsString) {
  var hmsStringArray = hmsString.split(':');
  var seconds = (+hmsStringArray[0]) * 60 * 60 + (+hmsStringArray[1]) * 60 + (+hmsStringArray[2]);
  return seconds;
}


function checkLightningAddress(address) {
// Lightning Peer ID: 02ec5c61cff2be8207851d909b72c15ec27d16d5aeeecf74b9170cb1f8ee6e0d64 [66 characters, hexadecimal]
  var addressValid = false;
  var regexString = /[0-9A-Fa-f]{6}/g;

  if ((address.length == 66) && (regexString.test(address))) {
    addressValid = true;
  }
  regexString.lastIndex = 0;
  return addressValid;
}


// Appends a Podcast to the Drop Down List once validated
function appendPodcastList(podcastName) {
  var podcastSelector = document.getElementById("jp-podcast-feeds");
  var podcastOption = document.createElement("option");
  if (podcastName == "Select a TEN Show")
    podcastOption.value = "";
  else
    podcastOption.value = podcastName;
  podcastOption.innerHTML = podcastName;
  podcastSelector.appendChild(podcastOption);
}

function ignoreSoundbiteChanged() {
//  console.log("");
}

$(document).ready(function () {
  if((window.location.pathname == "/createsoundbite/") || (window.location.pathname == "/createsoundbites.html")) { // MODIFIED
    appendPodcastList("Select a TEN Show");
    // Initial list by searching through the full webite list of feed URLs to check which ones actually have Soundbites Open flags in them
    podcastFullArray.forEach(podcast => {
      if(podcast.feed != "") {
        fetch(podcast.feed)
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
          const allitems = data.querySelectorAll("item");
          var foundSoundbiteOpen = false;
          allitems.forEach(item => {
            if (!(foundSoundbiteOpen)) {
              soundbitesOpen = item.querySelector("soundbites") ? item.querySelector("soundbites").getAttribute("open") : "";
              foundSoundbiteOpen = soundbitesOpen ? true : false;
              if (foundSoundbiteOpen) {
                podcastArray.push({podcast:podcast.podcast, feed:podcast.feed});
                appendPodcastList(podcast.podcast);
              }
            };
          }); // End item ForEACH
        });
      }
    });
    soundbite.startTime = 0;
    soundbite.endTime = 0;
    soundbite.duration = 0;
  }

  var totalPlayers = totalSoundbitePlayers;
  if((window.location.pathname == "/createsoundbite/") || (window.location.pathname == "/createsoundbites.html")) totalPlayers = 1; // MODIFIED
  for(let playerIndex = 0; playerIndex < totalPlayers; playerIndex++) {
    var newPlayerObject = $("#jquery-jplayer-" + playerIndex),
      fixFlash_mp4, // Flag: The m4a and m4v Flash player gives some old currentTime values when changed.
      fixFlash_mp4_id, // Timeout ID used with fixFlash_mp4
      ignore_timeupdate, // Flag used with fixFlash_mp4
      options = {
        ready: function (event) { // Hide the volume slider on mobile browsers. ie., They have no effect.
          if(event.jPlayer.status.noVolume) {
            $(".jp-gui").addClass("jp-no-volume"); // Add a class and then CSS rules deal with it.
          }
          // Determine if Flash is being used and the mp4 media type is supplied. BTW, Supplying both mp3 and mp4 is pointless.
          fixFlash_mp4 = event.jPlayer.flash.used && /m4a|m4v/.test(event.jPlayer.options.supplied);
        },
        loadeddata: function(event) {
          $('#jp-loadingfile').text("");
          $("#jp-loadingfile-" + playerIndex).text("");
          episodeLength[playerIndex] = event.jPlayer.status.duration;
          audioloaded[playerIndex] = true;
        },
        timeupdate: function(event) {
          if(!ignore_timeupdate) {
            myControl.progress.slider("value", event.jPlayer.status.currentPercentAbsolute);
          }
          currentPlayheadTime[playerIndex] = event.jPlayer.status.currentTime;
          if (testPlaying[playerIndex]) {
            if (event.jPlayer.status.currentTime > (hmsToSeconds($("#jp-starttime-selected-" + playerIndex).val()) + Number($("#jp-duration-selected-" + playerIndex).val()))) {
              $(this).jPlayer('pause');
              testPlaying[playerIndex] = false;
            }
          }
        },
        volumechange: function(event) {
          if(event.jPlayer.options.muted) {
            myControl.volume.slider("value", 0);
          } else {
            myControl.volume.slider("value", event.jPlayer.options.volume);
          }
        },
        swfPath: "/swf",
        supplied: "mp3",
        cssSelectorAncestor: ("#jp-container-" + playerIndex),
        wmode: "window",
        keyEnabled: true,
        play: function () {
          currentlyPlaying[playerIndex] = true;
        },
        pause: function () {
          currentlyPlaying[playerIndex] = false;
        }
      },
      myControl = {
        progress: $(options.cssSelectorAncestor + " .jp-progress-slider"),
        volume: $(options.cssSelectorAncestor + " .jp-volume-slider")
      };

      playerObjectArray.push(newPlayerObject.jPlayer(options)); // Instance jPlayer
      controlObjectArray.push(myControl);

      // Create the progress slider control
      myControl.progress.slider({
        animate: "fast",
        max: 100,
        range: "min",
        step: 0.1,
        value : 0,
        slide: function(event, ui) {
          var sp = $("#jquery-jplayer-" + playerIndex).data("jPlayer").status.seekPercent;
          if(sp > 0) {
            if(fixFlash_mp4) { // Apply a fix to mp4 formats when the Flash is used.
              ignore_timeupdate = true;
              clearTimeout(fixFlash_mp4_id);
              fixFlash_mp4_id = setTimeout(function() {
                ignore_timeupdate = false;
              },1000);
            }
            $("#jquery-jplayer-" + playerIndex).jPlayer("playHead", ui.value * (100 / sp)); // Move the play-head to the value and factor in the seek percent.
          } else {
            setTimeout(function() { // Create a timeout to reset this slider to zero.
              myControl.progress.slider("value", 0);
            }, 0);
          }
        }
      });

      // Create the volume slider control
      myControl.volume.slider({
        animate: "fast",
        max: 1,
        range: "min",
        step: 0.01,
        value : $.jPlayer.prototype.options.volume,
        slide: function(event, ui) {
          $("#jquery-jplayer-" + playerIndex).jPlayer("option", "muted", false);
          $("#jquery-jplayer-" + playerIndex).jPlayer("option", "volume", ui.value);
        }
      });


      $("#jp-testsoundbite-" + playerIndex).click (
        function(event) {
          var thisStartTime = soundbite.startTime;
          if((window.location.pathname == "/managesoundbites/") || (window.location.pathname == "/managesoundbites.html")) thisStartTime = hmsToSeconds($("#jp-starttime-selected-" + playerIndex).val()); // MODIFIED
          seekHeadPosition = (thisStartTime / episodeLength[playerIndex]) * 100.0;
          $("#jquery-jplayer-" + playerIndex).jPlayer("playHead", seekHeadPosition);
          controlObjectArray[playerIndex].progress.slider("value", seekHeadPosition);
          $("#jquery-jplayer-" + playerIndex).jPlayer("play", thisStartTime);
          testPlaying[playerIndex] = true;
      });


      $("#jp-seek-next-" + playerIndex).click (function(event) {
        if (currentlyPlaying[playerIndex]) $("#jquery-jplayer-" + playerIndex).jPlayer("play", (currentPlayheadTime[playerIndex] + skipDuration));
        else $("#jquery-jplayer-" + playerIndex).jPlayer("pause", (currentPlayheadTime[playerIndex] + skipDuration));
      });


      $("#jp-seek-prev-" + playerIndex).click (function(event) {
        if (currentlyPlaying[playerIndex]) $("#jquery-jplayer-" + playerIndex).jPlayer("play", (currentPlayheadTime[playerIndex] - skipDuration));
        else $("#jquery-jplayer-" + playerIndex).jPlayer("pause", (currentPlayheadTime[playerIndex] - skipDuration));
      });


      $("#jp-setstarttime-" + playerIndex).click (
        function(event) {
          if (audioloaded[playerIndex]) {
            var thisStartTime = currentPlayheadTime[playerIndex]; // Float need to convert into HH:mm:ss
            var thisOriginalStartTime = soundbite.startTime;
            var thisDuration = soundbite.duration;
            if((window.location.pathname == "/managesoundbites/") || (window.location.pathname == "/managesoundbites.html")) { // MODIFIED
              thisOriginalStartTime = hmsToSeconds($("#jp-starttime-selected-" + playerIndex).val());
              thisDuration = Number($("#jp-duration-selected-" + playerIndex).val());
            }
            var thisEndTime = thisOriginalStartTime + thisDuration;
            var thisOriginalStartTimeString = new Date(thisOriginalStartTime * 1000).toISOString().substring(11, 19);

            var startTimeString = new Date(thisStartTime * 1000).toISOString().substring(11, 19);
            var thisNewDuration = thisEndTime - thisStartTime;
            if ((thisNewDuration < 0) || (thisEndTime == 0)) thisNewDuration = 0;
            if (thisNewDuration <= maximumSoundbiteLength) {
              $('#jp-starttime-selected-' + playerIndex).val(startTimeString);
              $('#jp-duration-selected-' + playerIndex).val(thisNewDuration);
              if((window.location.pathname == "/createsoundbite/") || (window.location.pathname == "/createsoundbites.html")) { // MODIFIED
                soundbite.startTime = thisStartTime;
                soundbite.duration = thisNewDuration;
              }
            }
            else {
              $('#jp-starttime-selected-' + playerIndex).val(thisOriginalStartTimeString);
              alert("Duration must not be greater than 2 minutes");
            }
          }
          else
            alert("Load an episode first!");
      });


      $("#jp-starttime-selected-form-" + playerIndex).submit (
        function(event) {
          event.preventDefault();
          if (audioloaded[playerIndex]) {
            var enteredString = $("#jp-starttime-selected-" + playerIndex).val();
            var isGood = checkHMSFormat(enteredString);
            if (isGood) {
              var thisStartTime = hmsToSeconds(enteredString);
              var thisOriginalStartTime = soundbite.startTime;
              var thisDuration = soundbite.duration;
              if((window.location.pathname == "/managesoundbites/") || (window.location.pathname == "/managesoundbites.html")) { // MODIFIED
                thisDuration = Number($("#jp-duration-selected-" + playerIndex).val());
                thisOriginalStartTime = hmsToSeconds($("#jp-endtime-selected-" + playerIndex).val()) - thisDuration;
              }
              var thisEndTime = thisOriginalStartTime + thisDuration;
              var thisOriginalStartTimeString = new Date(thisOriginalStartTime * 1000).toISOString().substring(11, 19);
              var startTimeString = enteredString;
              var thisNewDuration = thisEndTime - thisStartTime;
              if ((thisNewDuration < 0) || (thisEndTime == 0)) thisNewDuration = 0;

              if (thisNewDuration <= maximumSoundbiteLength) {
                $('#jp-starttime-selected-' + playerIndex).val(startTimeString);
                $('#jp-duration-selected-' + playerIndex).val(thisNewDuration);
                if((window.location.pathname == "/createsoundbite/") || (window.location.pathname == "/createsoundbites.html")) { // MODIFIED
                  soundbite.startTime = thisStartTime;
                  soundbite.duration = thisNewDuration;
                }
              }
              else {
                $('#jp-starttime-selected-' + playerIndex).val(thisOriginalStartTimeString);
                alert("Duration must not be greater than 2 minutes");
              }
            }
            else {
              $("#jp-starttime-selected-" + playerIndex).val("");
              alert("Entry must be in the format Hours : Minutes : Seconds!");
            }
          }
          else {
            $("#jp-starttime-selected-" + playerIndex).val("");
            alert("Load an episode first!");
          }
        });

      $("#jp-setendtime-" + playerIndex).click (
        function(event) {
          if (audioloaded[playerIndex]) {
            var seekHeadPosition = 0.0;
            var thisEndTime = currentPlayheadTime[playerIndex]; // Float need to convert into HH:mm:ss
            var thisStartTime = soundbite.startTime;
            var thisDuration = soundbite.duration;
            if((window.location.pathname == "/managesoundbites/") || (window.location.pathname == "/managesoundbites.html")) { // MODIFIED
              thisStartTime = hmsToSeconds($("#jp-starttime-selected-" + playerIndex).val());
              thisDuration = $("#jp-duration-selected-" + playerIndex).val();
            }
            thisDuration = thisEndTime - thisStartTime;
            if (thisEndTime > episodeLength[playerIndex]) {
              thisDuration = (episodeLength[playerIndex] - thisEndTime);
              seekHeadPosition = ((thisStartTime + thisDuration) / episodeLength[playerIndex]) * 100.0;
              $("#jquery-jplayer-" + playerIndex).jPlayer("playHead", seekHeadPosition);
              alert("Duration must not be beyond the end of the episode audio");
            }
            if (thisDuration > maximumSoundbiteLength) {
              thisDuration = maximumSoundbiteLength;
              seekHeadPosition = ((thisStartTime + thisDuration) / episodeLength[playerIndex]) * 100.0;
              $("#jquery-jplayer-" + playerIndex).jPlayer("playHead", seekHeadPosition);
              alert("Duration must not be greater than 2 minutes");
            }
            if (thisEndTime < thisStartTime) {
              thisDuration = minimumSoundbiteLength;
              // TBD Adjust the Playhead position to match new value
              seekHeadPosition = ((thisStartTime + thisDuration) / episodeLength[playerIndex]) * 100.0;
              $("#jquery-jplayer-" + playerIndex).jPlayer("playHead", seekHeadPosition);
              alert("End Time must be after Start Time");
            }
            if (thisDuration < minimumSoundbiteLength) {
              thisDuration = minimumSoundbiteLength;
              seekHeadPosition = ((thisStartTime + thisDuration) / episodeLength[playerIndex]) * 100.0;
              $("#jquery-jplayer-" + playerIndex).jPlayer("playHead", seekHeadPosition);
              alert("Duration must be more than 5 seconds long");
            }
            var endTimeString = new Date((thisStartTime + thisDuration) * 1000).toISOString().substring(11, 19);
            $("#jp-endtime-selected-" + playerIndex).val(endTimeString);
            $("#jp-duration-selected-" + playerIndex).val(thisDuration);
            if((window.location.pathname == "/createsoundbite/") || (window.location.pathname == "/createsoundbites.html")) { // MODIFIED
              soundbite.startTime = thisStartTime;
              soundbite.duration = thisDuration;
            }
          }
          else {
            $("#jp-endtime-selected-" + playerIndex).val("");
            $("#jp-duration-selected-" + playerIndex).val("");
            alert("Load an episode first!");
          }
      });


      $("#jp-endtime-selected-form-" + playerIndex).submit (
        function(event) {
          event.preventDefault();
          if (audioloaded[playerIndex]) {
            var enteredString = $("#jp-endtime-selected-" + playerIndex).val();
            var isGood = checkHMSFormat(enteredString);
            if (isGood) {
              var seekHeadPosition = 0.0;
              var thisEndTime = hmsToSeconds(enteredString);
              var thisStartTime = soundbite.startTime;
              var thisDuration = thisEndTime - thisStartTime;
              if((window.location.pathname == "/managesoundbites/") || (window.location.pathname == "/managesoundbites.html")) { // MODIFIED
                thisStartTime = hmsToSeconds($("#jp-starttime-selected-" + playerIndex).val());
                thisDuration = $("#jp-duration-selected-" + playerIndex).val();
              }
              if (thisEndTime > episodeLength[playerIndex]) {
                thisDuration = (episodeLength[playerIndex] - thisEndTime);
                seekHeadPosition = ((thisStartTime + thisDuration) / episodeLength[playerIndex]) * 100.0;
                $("#jquery-jplayer-" + playerIndex).jPlayer("playHead", seekHeadPosition);
                alert("Duration must not be beyond the end of the episode audio");
              }
              if (thisDuration > maximumSoundbiteLength) {
                thisDuration = maximumSoundbiteLength;
                seekHeadPosition = ((thisStartTime + thisDuration) / episodeLength[playerIndex]) * 100.0;
                $("#jquery-jplayer-" + playerIndex).jPlayer("playHead", seekHeadPosition);
                alert("Duration must not be greater than 2 minutes");
              }
              if (thisEndTime < thisStartTime) {
                thisDuration = minimumSoundbiteLength;
                seekHeadPosition = ((thisStartTime + thisDuration) / episodeLength[playerIndex]) * 100.0;
                $("#jquery-jplayer-" + playerIndex).jPlayer("playHead", seekHeadPosition);
                alert("End Time must be after Start Time");
              }
              if (thisDuration < minimumSoundbiteLength) {
                thisDuration = minimumSoundbiteLength;
                seekHeadPosition = ((thisStartTime + thisDuration) / episodeLength[playerIndex]) * 100.0;
                $("#jquery-jplayer-" + playerIndex).jPlayer("playHead", seekHeadPosition);
                alert("Duration must be more than 5 seconds long");
              }
              var endTimeString = new Date((thisStartTime + thisDuration) * 1000).toISOString().substring(11, 19);
              $("#jp-endtime-selected-" + playerIndex).val(endTimeString);
              $("#jp-duration-selected-" + playerIndex).val(thisDuration);
              if((window.location.pathname == "/createsoundbite/") || (window.location.pathname == "/createsoundbites.html")) { // MODIFIED
                soundbite.startTime = thisStartTime;
                soundbite.duration = thisDuration;
              }
            }
            else {
              $("#jp-endtime-selected-" + playerIndex).val("");
              alert("Entry must be in the format Hours : Minutes : Seconds!");
            }
          }
          else {
            $("#jp-endtime-selected-" + playerIndex).val("");
            alert("Load an episode first!");
          }
        });


      $("#jp-duration-selected-form-" + playerIndex).submit (
        function(event) {
          event.preventDefault();
          if (audioloaded[playerIndex]) {
            var enteredString = $("#jp-duration-selected-" + playerIndex).val();
            var isGood = checkSecondsFormat(enteredString);
            if (isGood) {
              var seekHeadPosition = 0.0;
              var thisStartTime = soundbite.startTime;
              var thisEndTime = thisStartTime + Number(enteredString);
              var thisDuration = Number(enteredString);
              if((window.location.pathname == "/managesoundbites/") || (window.location.pathname == "/managesoundbites.html")) { // MODIFIED
                thisStartTime = hmsToSeconds($("#jp-starttime-selected-" + playerIndex).val());
                thisDuration = $("#jp-duration-selected-" + playerIndex).val();
              }
              if (endTime > episodeLength[playerIndex]) {
                thisDuration = (episodeLength[playerIndex] - endTime);
                alert("Duration must not be beyond the end of the episode audio");
              }
              if (thisDuration > maximumSoundbiteLength) {
                thisDuration = maximumSoundbiteLength;
                alert("Duration must not be greater than 2 minutes");
              }
              if (endTime < thisStartTime) {
                thisDuration = minimumSoundbiteLength;
                alert("End Time must be after Start Time");
              }
              if (thisDuration < minimumSoundbiteLength) {
                thisDuration = minimumSoundbiteLength;
                alert("Duration must be more than 5 seconds long");
              }
              var endTimeString = new Date((thisStartTime + thisDuration) * 1000).toISOString().substring(11, 19);
              seekHeadPosition = ((thisStartTime + thisDuration) / episodeLength[playerIndex]) * 100.0;
              $("#jquery-jplayer-" + playerIndex).jPlayer("playHead", seekHeadPosition);
              $("#jp-endtime-selected-" + playerIndex).val(endTimeString);
              $("#jp-duration-selected-" + playerIndex).val(thisDuration);
              if((window.location.pathname == "/createsoundbite/") || (window.location.pathname == "/createsoundbites.html")) { // MODIFIED
                soundbite.startTime = thisStartTime;
                soundbite.duration = thisDuration;
              }
            }
            else {
              $("#jp-endtime-selected-" + playerIndex).val("");
              alert("Entry must be in Seconds!");
            }
          }
          else
            alert("Load an episode first!");
      });

  } // End of Init Object For Loop


  // Define hover states of the standard buttons
  $('.jp-gui ul li').hover(
    function() { $(this).addClass('ui-state-hover'); },
    function() { $(this).removeClass('ui-state-hover'); }
  );


  // Define hover states of my custom-ish buttons
  $('.jjp-button').hover(
    function() { $(this).addClass('jjp-state-hover'); },
    function() { $(this).removeClass('jjp-state-hover'); }
  );


  $('#jp-podcast-selector').change (function() {
    var select = document.getElementById("jp-podcast-feeds");
    var selectedPodcast = select.options[select.selectedIndex].value;
    var selectedURL = "";
    podcastArray.forEach(podcast => {
      if (podcast.podcast == selectedPodcast)
        selectedURL = podcast.feed;
    });
    if (selectedURL != "")
      $('#jp-podcastfeed').val(selectedURL);
  });


  // LoadFile is only an option where there is a single player
  $('#jp-loadfile').click (function() {
    var select = document.getElementById("jp-episode-options");
    var selectedepisode = select.options[select.selectedIndex].value;
    if (selectedepisode != "") {
      var episodeMP3file = "";
      items.forEach(item => {
        if (item.episode == selectedepisode)
          episodeMP3file = item.enclosure;
      });

      $("#jquery-jplayer-0").jPlayer("setMedia", {
        mp3: episodeMP3file
      });
      soundbite.url = episodeMP3file;
      $('#jp-loadingfile').text("Loading...");
    }
  });


    function getOptionals(playerIndex) {
      var valueTitle = $("#jp-title-selected-" + playerIndex).val();
      if (valueTitle != "") {
        if (valueTitle.length > 128) {
          valueTitle = valueTitle.substring(0, 127);
          alert("Your title has been truncated at 128 characters long");
        }
        soundbite.title = valueTitle;
      }

      var valueName = $("#jp-name-selected-" + playerIndex).val();
      if (valueName != "")
        soundbite.name = valueName;

      // Lightning Peer ID: 02ec5c61cff2be8207851d909b72c15ec27d16d5aeeecf74b9170cb1f8ee6e0d64 [66 characters, hexadecimal]
      var valueAddress = $("#jp-address-selected-" + playerIndex).val();
      if (valueAddress != "") {
        var addressValid = checkLightningAddress(valueAddress);
        if (addressValid)
          soundbite.address = valueAddress;
        else
          alert("Lightning Address is not valid!");
      }
      var valueType = $("#jp-type-options-" + playerIndex).val();
      if ((valueAddress != "") && (valueType == "Lightning"))
        soundbite.type = "node";
    }

    $('#jp-submitviafile').click (
      function() {
        getOptionals(0); // Only ever refer to Index 0 for a single player
        if ((soundbite.startTime != undefined) && (soundbite.duration != undefined) && (soundbite.title != "")) {
          var jsonSoundbite = JSON.stringify({startTime:soundbite.startTime, duration:soundbite.duration, title:soundbite.title, url:soundbite.url, name:soundbite.name, type:soundbite.type, address:soundbite.address, customKey:soundbite.customKey, customValue:soundbite.customValue}, null, '\t');
          var blob = new Blob([jsonSoundbite], {type: "application/json"});
          saveAs(blob, "soundbite.json");
        }
        else
          alert("Must have a minimum: Start Time, End Time/Duration and Title to submit!");
      });

      // Build all data from DOM Objects to de-couple from instance variables
    $('#soundbite-export-file').click (
      function() {
        for (var playerIndex = 0; playerIndex < totalSoundbitePlayers; playerIndex++) if (document.getElementById("soundbite-editor-" + playerIndex).style.display == "none") break;
        var totalSoundbites = playerIndex;
        var pageSoundbites = [];
        var thisSoundbite = [];
        for (var playerIndex = 0; playerIndex < totalSoundbites; playerIndex++) {
          thisSoundbite = [];
          thisSoundbite = {
            enabled:document.getElementById("soundbite-selected-" + playerIndex).checked,
            startTime:hmsToSeconds(document.getElementById("jp-starttime-selected-" + playerIndex).value),
            duration:Number(document.getElementById("jp-duration-selected-" + playerIndex).value),
            title:document.getElementById("jp-title-selected-" + playerIndex).value,
            url:($("#jquery-jplayer-" + playerIndex).data("jPlayer").status.media.mp3),
            name:document.getElementById("jp-name-selected-" + playerIndex).value,
            type:((document.getElementById("jp-type-options-" + playerIndex).value == "Lightning") ? "node" : ""),
            address:(checkLightningAddress(document.getElementById("jp-address-selected-" + playerIndex).value) ? (document.getElementById("jp-address-selected-" + playerIndex).value) : "")
//            customKey:"",
//            customValue:""
          };
          pageSoundbites.push(thisSoundbite);
        }
        var jsonSoundbite = JSON.stringify(pageSoundbites, null, '\t');
        var blob = new Blob([jsonSoundbite], {type: "application/json"});
        saveAs(blob, "soundbite.json");
      });


  $('#jp-checkfeed').click (
    function() {
      var RSS_URL = document.getElementById('jp-podcastfeed').value
      if(RSS_URL == "")
      $('#jp-loadingfeed').text("No feed entered");
      else
       $('#jp-loadingfeed').text("Checking feed...");
       items = [];
        fetch(RSS_URL)
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
          const allitems = data.querySelectorAll("item");
          const email = data.querySelectorAll("email")[0].textContent;

          allitems.forEach(item => {
            episode = item.querySelector("episode") ? item.querySelector("episode").textContent : "";
            title = item.querySelector("title") ? item.querySelector("title").textContent : "";
            soundbitesOpen = item.querySelector("soundbites") ? item.querySelector("soundbites").getAttribute("open") : "";
            enclosureSoundbites = item.querySelector("soundbites") ? item.querySelector("soundbites").getAttribute("enclosure") : "";
            enclosureFeed = item.querySelector("enclosure") ? item.querySelector("enclosure").getAttribute("url") : "";
            enclosure = enclosureSoundbites ? enclosureSoundbites : enclosureFeed; // Use the URL in the Soundbite tag, if present
            allEpisodes = document.getElementById("ignore-soundbite-open").checked; // If All Listed Episodes is checked then always load episodes irrespective
            if ((episode != "") && (soundbitesOpen || allEpisodes))
            items.push({'episode':episode, 'title':title, 'enclosure':enclosure, 'soundbites':soundbitesOpen});
          });
          var select = document.getElementById("jp-episode-options");
          select.options.length = 0;
          var firstOption = document.createElement("option");
          firstOption.value = "";
          firstOption.innerHTML = "Select an episode...";
          select.appendChild(firstOption);
          items.forEach(item => {
            var option = document.createElement("option");
            option.value = item.episode;
            option.innerHTML = item.title;
            select.appendChild(option);
          });
          if (items.length > 0) $('#jp-loadingfeed').text("Found " + items.length + " episodes:");
          else $('#jp-loadingfeed').text("No eligible episodes");
      });
    });
  });
