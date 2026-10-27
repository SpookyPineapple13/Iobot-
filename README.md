## Iobot

### Goals
* Quickly obtain information regarding the school schedule for any day the user requests
* Display the scheduled for the day to be understand a quick glance via a one page layout (no scroll)
* Be easily updated according to the school’s iCalendar feed
* Provide customizability to the user’s schedule and create a sleek, modular, and visually appealing display

### Composition
* Decoupled - frontend + backend are separate entities (client and server)
* JavaScript, CSS, and HTML client-side rendering
* Flask Web API (Python)

See the requirements.txt for more information on the modules used by the Server 

<br>

## Calendar Fetching, Caching, and Parsing
***The Server Cache is stored as a Python Dictionary***

Four libraries are involved in the use of the iCal feed
* iCal - The standard API for interacting with the iCal text file fetched from the school calendar
* APScheduler - Used to repeatedly fetch and cache the iCal
* Flask-Cache - For caching the entirety of the fetched iCal text file
* MD5 Hashes - Generates the eTags used to identify caches 

### Server-side Caching 
***The Cache is updated every 3 minutes***

Every time the cache is updated, MD5 hashes the text contents of the iCal file (an eTag) and compares it to the eTag of the current cache.

* If the eTags match, the old cache and eTag is kept
* If the the eTags differ, the new cache and eTag are stored

### Client-side Caching
***The client caches using the localStorage Web API as a JavaScript Object*** <br>
***The server parses its cache into a JSON before sending it to the client***

The client requests and stores 2 things from the server
* The last cache it was told to use (by the server)
* The eTag of its current cache

Every time the client requests a schedule from a specified date, it sends the eTag in a POST request. 
* In the event that the eTag differ, the server sends its cache and eTag over for the client to store and use.
* Matching client and server eTags are responded to with a 304 code, to which the client interprets as a go ahead to use its current cache

This prevents unnecessary cache transactions between the server and client, decreasing load speed.

## AI Usage
Google Gemini was used to generate some boiler point code and tool functions, mostly regarding CSS styling and tedious Date object parsing functions (app.js).

For the most part, Gemini was used as a learning resource for learning JS, CSS, and HTML, as this is my first time using the three in such a way (also with Python Flask, but I’ve had past Python experience). Other resources included the MDN web doc guides and the official Flask documentation. 

