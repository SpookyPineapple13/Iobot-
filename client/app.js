const API_BASE_URL = "http://127.0.0.1:5000"
let connectionStatus = false

class InputCard extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title') || 'Input Title';

    this.innerHTML = `
      <div class="preference-card">
        <h3>${title}</h3>
        <label for="${title}">Name: </label>
        <input type="text" id="${title}" name="${title}">
        
        <br>
        <label for="periodRoom">Room: </label>
        <input type="text" id="periodRoom" name="room">
        
        <br>
        <label for="periodTeacher">Teach: </label>
        <input type="text" id="periodTeacher" name="teacher">
      </div>
    `;
  }
}

customElements.define('input-card', InputCard);

// Refreshing the page through the "Load Schedule" button
const bGetSchedule = document.getElementById("load-schedule")
const iGetSchedule = document.getElementById("load-schedule-input")
bGetSchedule.addEventListener("click", () => {
    pollData(iGetSchedule.value)
})

function updateCache() {
    console.log("Checking Cache")
    let etag = localStorage.getItem("etag")
    if (!etag){etag = "none"}
    
    const promise = fetch(
        `${API_BASE_URL}/schedule/`,
        {
        method: "POST", 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({"etag": etag})
        }
    ).then(res => {
        if (res.status == 304) { // Do nothing if the cache is modern 
            throw new Error("MODERN")
        } 
        else if  (!res.ok) {
            displayCouldNotConnect()
            console.log(res.status)
            throw new Error("Could not connect to the server")
        }
        return res.json()
    }).then(data => { // Update the cache

        localStorage.setItem("cal", JSON.stringify(data["events"]))
        localStorage.setItem("etag", data["etag"])

        const cacheStatus = document.getElementById("cache-status");
        cacheStatus.textContent = "Calendar is Synced"
        console.log("Cache updated")
    }).catch(err => {
        if (err.message == "MODERN") {
            const cacheStatus = document.getElementById("cache-status");
            cacheStatus.textContent = "Calendar is Synced"
            console.log("Cache is modern")
        }
        else {
            const cacheStatus = document.getElementById("cache-status");
            cacheStatus.textContent = "Cache may be outdated"
            console.log("Could not update the cache: " + err.message)
        }
    })
}

async function getSchedule(targetDate) {
    const schedule = [];
    const cal = JSON.parse(localStorage.getItem("cal") || "[]");
    console.log(`Searching for date: ${targetDate}`);

    let eventDate = "yyyy-mm-dd" // placeholder
    for (const event of cal) {

        // schedule days are set to midnight - intended date
        if (event.summary.includes("Schedule")) {
            eventDate = event.date
        }
        else {
            let eventDateObj = new Date(event.start)
            eventDate = eventDateObj.toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                timeZone: "Pacific/Honolulu"
            })
            eventDate = eventDate.replaceAll("/", "-")
        }
    
        if (eventDate == targetDate) {
            schedule.push(event);
        }
    }
    console.log(schedule)

    return schedule;
}

function renderDate(date) {
    const dateElement = document.getElementById("current-date");
    
    date.setUTCHours(date.getUTCHours() + 10) // schedule dates are at 00, gets pushed back
    dateElement.textContent = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Pacific/Honolulu"
    })
}

function renderSchedule(schedule) {
    const scheduleElement = document.getElementById("schedule");
    const scheduleType = document.getElementById("day-schedule")

    // The first event is always the schedule type, splice it
    let scheduleTypeData = schedule.splice(0, 1)[0]
    scheduleType.textContent = scheduleTypeData.summary
    renderDate(new Date(scheduleTypeData.date))

    // Clear previously rendered periods.
    scheduleElement.replaceChildren();

    for (const period of schedule) {
        const card = document.createElement("article");
        card.classList.add("period-card");

        const heading = document.createElement("h2")
        heading.textContent = period.summary

        const subject = document.createElement("h3");
        subject.textContent = period.name;
        
        // display times
        let jsStart = new Date(period.start); 
        let jsEnd = new Date(period.end);
        
        const time = document.createElement("p");
        time.textContent =
            `${jsStart.toLocaleTimeString([], {timeZone: "Pacific/Honolulu", timeStyle:"short"})} – ${jsEnd.toLocaleTimeString([], {timeZone: "Pacific/Honolulu", timeStyle:"short"})}`;

        card.append(heading, subject, time);

        if (period.location) {
            const location = document.createElement("p");
            location.textContent = period.location;
            card.append(location);
        }

        if (period.teacher) {
            const teacher = document.createElement("p");
            teacher.textContent = period.teacher;
            card.append(teacher);
        }

        scheduleElement.append(card);
    }
}

function getOrdinalSuffix(number) {
    if (number % 100 >= 11 && number % 100 <= 13) {
        return "th";
    }

    switch (number % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}

function setScheduleLoading(dateString) {
    renderDate(new Date(dateString)) // Filler
    const scheduleElement = document.getElementById("schedule");
    scheduleElement.replaceChildren()
    const scheduleType = document.getElementById("day-schedule")
    scheduleType.textContent = "Loading Schedule..."
}

function setScheduleNone(dateString) {
    renderDate(new Date(dateString)) // Filler
    const scheduleElement = document.getElementById("schedule");
    scheduleElement.replaceChildren()
    const scheduleType = document.getElementById("day-schedule")
    scheduleType.textContent = "No Data "
}


async function pollData(dateString) {
    setScheduleLoading(dateString)
    await updateCache()
    const schedule = await getSchedule(dateString)
    if (schedule.length == 0) {setScheduleNone(dateString); return}
    else {renderSchedule(schedule)}
}

// NOTE: corresponds to the system loca timezone - shouldn't matter for intended users
function pollToday(){
    const now = new Date()
    let todayString = now.toLocaleDateString("en-ZA", { // convert to yyyy-mm-dd
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).replaceAll("/", "-")
    pollData(todayString)
}

function displayCouldNotConnect(error) {
    const status = document.getElementById("connection-status")
    const cacheStatus = document.getElementById("cache-status");
    status.textContent = "Could not connect to the Server"
    cacheStatus.textContent = error
}

function checkConnectionUI() {
    const scheduleType = document.getElementById("day-schedule")
    const dateElement = document.getElementById("current-date");

    scheduleType.textContent = "Connecting to Server"
    dateElement.textContent = "Downloading Calendar"
}

// Check for connection, then poll today
function startupConnection(){
    checkConnectionUI()
    const status = document.getElementById("connection-status")
    const responsePromise = fetch(`${API_BASE_URL}/hello`)

    responsePromise
        .then((res) => {
            
            if (!res.ok) {
                displayCouldNotConnect()
                connectionStatus = false
                throw new Error("could not connect to the server")
            }
            status.textContent = "Connected to Server"
            console.log("connected to server")
            connectionStatus = true
        })
        .catch((error) => {
            displayCouldNotConnect(error)
            console.error(error)
            connectionStatus = false
        });
}

async function main(){
    startupConnection()
    updateCache()
    pollToday()
}

main()
