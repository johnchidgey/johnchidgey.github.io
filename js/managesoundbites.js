/*! managesoundbites.js
 *
 * Manage Soundbites v0.1 - Soundbite Client Demo Application
 *
 * 3 July, 2022 - John Chidgey
 *
 * Developed specifically for Soundbite functionality
 */

'use strict';

var podcastList = [];
const localImportDirectoryPath = '/Users/johnchidgey/Documents/sites/engineered/static/soundbiteimport/';
const localImportURLPath = '/soundbiteimport/';
const webSocketPort = 5001;

window.Soundbite = window.Soundbite || {};

Soundbite.Bot = (function ($) {
	var connection = null;

	function init() {
		$(function () {
			connectSocket();
		});
	}


  function sendCommand(command) {
      $(function () {
          if (connection != null) {
              connection.send(JSON.stringify({operation: 'COMMAND', id: command}));
          }
          return false;
      });
  }


  function ping() {
      if (connection != null) {
          connection.send(JSON.stringify({operation: 'PING'}));
      }
      $('.time').each(function () {
          var time = $(this).data('time');
          var ago = moment(time).fromNow();
          $(this).html(moment($(this).data('time')).fromNow())
      });
  }


	// Create a drop down list for all the podcasts configured on the server
	// Use the Soundbites sub-folder to determine this, and then query the RSS Feeds for each to get the full episode list
	// Then flag those episodes that already have Soundbites available for them with a note "List"
	function podcastDropdownCreate(podcastList) {
		var listName = 'podcast-list';
		var htmlOutput = document.createElement('div');
		var titleHeader = document.createElement('h2');
		var listNameText = '';
		var titleText = document.createTextNode(listNameText);
		titleHeader.appendChild(titleText);
		if (podcastList.length > 0) {
			var listSelector = document.createElement('select');
			listSelector.setAttribute("id","#podcast-selector");
			listSelector.setAttribute("onchange","podcastSelectionChanged()");
			var listOption = document.createElement('option');
			listOption.setAttribute("value", "");
			listOption.appendChild(document.createTextNode("Select podcast..."));
			listSelector.appendChild(listOption);
			podcastList.forEach((podcast, index) => {
				var listOption = document.createElement('option');
				listOption.setAttribute("value", podcast.folder);
				listOption.appendChild(document.createTextNode(podcast.title));
				listSelector.appendChild(listOption);
			});
		}
		htmlOutput.appendChild(titleHeader);
		htmlOutput.appendChild(listSelector);
		$('#' + listName).empty();
		$('#' + listName).append(htmlOutput);
	}


	function connectSocket() {
		if (connection == null || connection.readyState == 3) {
			// Connect to the server and await feedback.
      if (window.location.hostname == 'localhost' || window.location.hostname == '') {
        connection = new WebSocket('ws://localhost:' + webSocketPort);
      } else {
//        connection = new WebSocket('wss://soundbitten.herokuapp.com');
				connection = new WebSocket('wss://ws.techdistortion.com:' + webSocketPort);
      }

			connection.onopen = function (event) {
        setInterval(ping, 30000);
			};

			connection.onmessage = function (message) {
				var packet = JSON.parse(message.data);
        if (packet.operation == 'REFRESH') {
					console.log(packet.soundbites);
            var mysoundbites = packet.soundbites;
						mysoundbites.forEach((podcast, index) => {
							podcastList.push({title:podcast.title, folder:podcast.folder, url:podcast.url, episodes:podcast.episodes});
						});
						podcastDropdownCreate(podcastList);
        } else if (packet.operation == 'PONG') {
            // NOOP
        }
			};

			connection.onclose = function (event) {
				$('.tables').fadeOut(function () {
          $('.message').fadeIn();
        });
        setTimeout(connectSocket, 5000);
        clearInterval(ping);
			};

			connection.onerror = function (error) {
				console.log("Error: " + JSON.stringify(error));
			};
		} else {
			setTimeout(connectSocket, 5000);
		}
	}

	return {
		init: init,
    sendCommand: sendCommand
	};
})(jQuery); // End of Soundbite Function


// Create a drop down list for all the episodes with soundbites already configured on the server
function episodeDropdownCreate(selectedPodcast) {
	var listName = 'episode-list';
	var htmlOutput = document.createElement('div');
	var titleHeader = document.createElement('h2');
	var listNameText = '';
	var titleText = document.createTextNode(listNameText);
	titleHeader.appendChild(titleText);
	if (podcastList.length > 0) { // Shouldn't need to trap here (again) but why not?
		var listSelector = document.createElement('select');
		listSelector.setAttribute("id","#episode-selector");
		listSelector.setAttribute("onchange","episodeSelectionChanged()");
		document.getElementById("soundbite-open-only-box").style.display = "inline-block";
		document.getElementById("soundbite-list-only-box").style.display = "inline-block";
		var soundbiteOpenOnlySelected = document.getElementById("soundbite-open-only").checked;
		var soundbiteListOnlySelected = document.getElementById("soundbite-list-only").checked;
		var listOption = document.createElement('option');
		listOption.setAttribute("value", "");
		listOption.appendChild(document.createTextNode("Select episode..."));
		listSelector.appendChild(listOption);
		var soundbitesOpenFlag = "";
		var soundbitesFilePresentFlag = "";
		var includeEpisode = false;
		podcastList.forEach((podcast, index) => {
			if (podcast.folder == selectedPodcast) {
				podcast.episodes.forEach((episode, episodeindex) => {
					includeEpisode = false;
					if (soundbiteOpenOnlySelected && (episode.soundbitesOpen == "true")) includeEpisode = true;
					if (soundbiteListOnlySelected && (episode.soundbites)) includeEpisode = true;
					if (!soundbiteOpenOnlySelected && !soundbiteListOnlySelected) includeEpisode = true;
					if (includeEpisode) {
						var listOption = document.createElement('option');
						listOption.setAttribute("value", episode.episode);
						soundbitesOpenFlag = episode.soundbitesOpen ? " Open" : "";
						soundbitesFilePresentFlag = episode.soundbites ? " List" : "";
						listOption.appendChild(document.createTextNode(episode.episode + soundbitesOpenFlag + soundbitesFilePresentFlag)); // Episode Number Only
						listSelector.appendChild(listOption);
					}
				});
			}
		});
	}
	htmlOutput.appendChild(titleHeader);
	htmlOutput.appendChild(listSelector);
	$('#' + listName).empty();
	$('#' + listName).append(htmlOutput);
}


function podcastSelectionChanged() {
	var select = document.getElementById("#podcast-selector");
	var selectedPodcast = select.options[select.selectedIndex].value;
	episodeDropdownCreate(selectedPodcast);
}


function episodeOpenChanged() {
	episodeDropdownCreate(document.getElementById("#podcast-selector").options[document.getElementById("#podcast-selector").selectedIndex].value);
}


function episodeListChanged() {
	episodeDropdownCreate(document.getElementById("#podcast-selector").options[document.getElementById("#podcast-selector").selectedIndex].value);
}


function loadSoundbite(loadSoundbite, loadSoundbiteIndex) {
	document.getElementById("soundbite-editor-" + loadSoundbiteIndex).style.display = "block";
	document.getElementById("soundbite-selected-" + loadSoundbiteIndex).checked = loadSoundbite.enabled;
	var startTimeString = new Date(loadSoundbite.startTime * 1000).toISOString().substring(11, 19);
	document.getElementById("jp-starttime-selected-" + loadSoundbiteIndex).value = startTimeString;
	var endTimeString = new Date((loadSoundbite.startTime + loadSoundbite.duration) * 1000).toISOString().substring(11, 19);
	document.getElementById("jp-endtime-selected-" + loadSoundbiteIndex).value = endTimeString;
	document.getElementById("jp-duration-selected-" + loadSoundbiteIndex).value = loadSoundbite.duration;
	document.getElementById("jp-name-selected-" + loadSoundbiteIndex).value = loadSoundbite.name;
	document.getElementById("jp-title-selected-" + loadSoundbiteIndex).value = loadSoundbite.title;
	document.getElementById("jp-address-selected-" + loadSoundbiteIndex).value = loadSoundbite.address;
	$("#jquery-jplayer-" + loadSoundbiteIndex).jPlayer("setMedia", { mp3: loadSoundbite.url });
	$("#jp-loadingfile-" + loadSoundbiteIndex).text("Loading...");
}

// Build all the soundbite objects
function episodeSelectionChanged() {
	var select = document.getElementById("#podcast-selector");
	var selectedPodcast = select.options[select.selectedIndex].value;
	var select = document.getElementById("#episode-selector");
	var selectedEpisode = select.options[select.selectedIndex].value;

	// Hide existing, will be displayed if applicable
	document.getElementById("soundbite-export").style.display = "none";
	for (var playerIndex = 0; playerIndex < totalSoundbitePlayers; playerIndex++) document.getElementById("soundbite-editor-" + playerIndex).style.display = "none";
	var totalSoundbites = playerIndex;
	if ((selectedPodcast != "") && (selectedPodcast != "")) {
		podcastList.forEach((podcast, podcastIndex) => {
			if (podcast.folder == selectedPodcast) {
				podcast.episodes.forEach((episode, episodeIndex) => {
					if (episode.episode == selectedEpisode) {
						if (episode.soundbites) {
							episode.soundbites.forEach((soundbite, soundbiteIndex, soundbiteArray) => {
								if (soundbiteIndex == 0) {
									document.getElementById("soundbite-export").style.display = "block";
									if (soundbiteArray.length < totalSoundbitePlayers) document.getElementById("soundbite-import").style.display = "block";
								}
								loadSoundbite(soundbite, soundbiteIndex);
							});
						}
						else document.getElementById("soundbite-import").style.display = "block";
					}
				});
			}
		});
	}
}

// Extract SoundBite JSON File for import
function soundbiteFileChanged() {
	var fileNameAndPath = localImportURLPath + document.getElementById("soundbite-import-button").files[0].name;
	var fileSuffix = fileNameAndPath.split('.').pop()
	for (var playerIndex = 0; playerIndex < totalSoundbitePlayers; playerIndex++) if (document.getElementById("soundbite-editor-" + playerIndex).style.display == "none") break;
	var totalSoundbites = playerIndex;
	if (fileSuffix == "json") {
		try {
			fetch(fileNameAndPath)
			.then(response => {
				return response.json();
			})
			.then(data => {
				// TBD Do some quality checks here at some point in my life
				var newSoundbite = {enabled:false, startTime:data.startTime, duration:data.duration, title:data.title, url:data.url, name:data.name, type:data.type, address:data.address, customKey:"", customValue:""};
				document.getElementById("soundbite-export").style.display = "block";
				loadSoundbite(newSoundbite, totalSoundbites);
			});
		} catch(err) { console.log('Unable to scan directory: ' + err); }
	}
	else {
		console.log("Not a JSON file");
	}
}
