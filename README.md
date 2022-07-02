# Soundbiter - Soundbite NodeJS Server Demo Application (johnchidgey.github.io)

Release Notes: v0.1 - 3 July, 2022 - John Chidgey

There are two components in the example website, hosted on GitHub Pages:

- Create SoundBite
- Manage Soundbites (Required NodeJS Server application)

**Create Soundbite**

How to create a Soundbite...

1. Select a pre-coded list of shows of your choice (modify the array "podcastFullArray" in jjs.js) that have at least one episode with the Soundbite Enabled flag in their RSS Feed Item, then pre-populates the Feed URL. Alternatively, simply copy and paste the RSS URL of the show you want to create a soundbite for.
2. Select "Check Feed" and it will generate a drop down list of all episodes in that feed with the Soundbite Enabled flag active.
3. Select which episode you want to create a Soundbite for
4. Select "Load Episode" and once the "Loading..." text has cleared, you should see the WebPlayer beneath is loaded with a end time stamp for the total duration of that episode.
5. Play the episode, skip forward, back (obviously) until you find the start point of your soundbite, Pause the playback then select "Set Start Time" and that timestamp will appear in the adjacent Start Time box in HH:MM:SS format.
6. Play forwards until you find the end point, then select "Set End Time" and that timestamp will appear in the adjacent End Time box in HH:MM:SS format, and the Duration will also then appear in its box.
7. At any time you can adjust the values directly through those boxes if desired.
8. Test the soundbite you've created by selecting "Test Soundbite" once Start/End/Durations have been selected
9. Give the Soundbite a Title, and you are able to select "Submit via File" or you can add optional information as well for attribution and Lightning split
10. [Optional] Fill in your Name and Lightning Node address.
11. Select "Submit via File" and the browser will ask for permission (most likely, if first time you've done this) and once you Allow downloads from the site, it will download a file "soundbite.json"
12. EMail your soundbite JSON files to your podcast admin for them to consider adding to their episode.

Restrictions:

- Direct entry of times and durations only supports whole integer values
- Soundbites may only be 120 seconds (2 minutes) long (per Standard)
- Type of V4V support is only Lightning at this time (per Standard)
- There is no support for direct server submission, file via EMail for v0.1

 * Companion Application for Soundbite Demo: https://johnchidgey.github.io/managesoundbites.html
 * Manage Soundbite functionality requires this server to be running

**Create Soundbite: Future Feature/Wish List**

- More precise time editing controls (sub-second skip fwd/back controls) and time entry to milliseconds
- Direct Server submission rather than via EMail (will require NodeJS component)

**Manage Soundbites**

Configuring: In "/js/managesoundbites.js" modify the "localImportURLPath" [Soundbite Import folder] or "localImportDirectoryPath" [Soundbite per episode files] to where you're keeping your Import and Per-Episode Soundbite files.

How to manage soundbites...

Notes for v0.1:
- Any user-submitted soundbite JSON files MUST be placed in the soundbiteimport folder, and this must be served on the WebServer the Web App is running on. This is due to browser security limitations of reading local files.
- File-writedown on save is not supported in browser and ran out of time to implement writedown via the Soundbitten NodeJS component. Therefore output files are saved via a Download in the browser, and must be copied back to the source folder.

Soundbite episodes can have an existing "List" of Soundbites and/or be "Open" to accepting user submitted Soundbites. The episode list will always show the Episode number, if it's Open, and if it has a List already that can be edited.

The source and saved Soundbite combined files are one per episode, and contain a flag that can be used by the podcast platform to determine whether to create a final x.json file for each respective entry. In systems where this is not the case, the flag will simply be ignored by the standard and all Soundbites in the file will be published.

1. Select from the list of shows built from a combination of folders on the Soundbitten NodeJS server, along with their RSS feeds.
2. Select the episode of the Podcast you wish to manage Soundbites for. By default, only those with an existing "List" of Soundbites in the local folder are shown. In the Demo, that's Causality, Episodes 1 and 10. Note: If you unselect "List" then it will show all episodes in the feed. You can also select episodes where Soundbites are "Open" for submission.
3. Select "Choose File" to import a Soundbite user submission from the Import folder. This will be added to the last position in the Soundbite list. It will be imported with "Include this soundbite" unchecked.
4. All existing Soundbites from the episode file will be pre-populated in WebPlayers for individual editing, test playback and review.
5. Select which Soundbites are to be flagged as "Included"
6. Select "Submit via File" and the browser will ask for permission (most likely, if first time you've done this) and once you Allow downloads from the site, it will download a file "soundbite.json" which is the updated x.json file that can be copied back over the original (v0.1).

Restrictions:

- There can be no more than 10 Soundbites to be managed for any given episode (recommend not more than 4 per episode are enabled)

**Manage Soundbites: Future Feature/Wish List**

- Better support for client file import
- Write-back of Exported Soundbite file via NodeJS to source file
- Concurrent web player Play/Stop functionality (only let one instance play at a time)
- More precise time editing controls (sub-second skip fwd/back controls) and time entry to milliseconds
