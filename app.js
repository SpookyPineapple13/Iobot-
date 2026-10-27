const API_BASE_URL = "https://iobot-6mcg.onrender.com"
let connectionStatus = false

// Refreshing the page through the "Load Schedule" button
const bGetSchedule = document.getElementById("load-schedule")
const iGetSchedule = document.getElementById("load-schedule-input")
bGetSchedule.addEventListener("click", () => {
    pollData(iGetSchedule.value)
})

function syncStyle(event) {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const element = document.documentElement

    // light mode
    if (!isDarkMode) {
        element.style.setProperty("--bg-color", "white")
        element.style.setProperty("--title-color", "black")
        element.style.setProperty("--outside-text-color", "black")
        element.style.setProperty("--head-color", "black")
        element.style.setProperty("--card-color", "white")
    }
    else {
        // dark mode
        element.style.setProperty("--bg-color", "black")
        element.style.setProperty("--title-color", "white")
        element.style.setProperty("--outside-text-color", "white")
        element.style.setProperty("--head-color", "white")
        element.style.setProperty("--card-color", "lightgray")
    }
}

const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMediaQuery.addEventListener('change', (event) => syncStyle(event));

async function updateCache() {
    const cacheStatus = document.getElementById("cache-status");
    cacheStatus.textContent = "Downloading..."
    console.log("Checking Cache")

    let etag = localStorage.getItem("etag")
    if (!etag){etag = "none"}
    
    return fetch(
        `${API_BASE_URL}/schedule/`,
        {
        method: "POST", 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({"etag": etag})
        }
    
    ).then(res => {
        if (res.status == 304) {throw new Error("MODERN")} // Do nothing if the cache is modern 
        else if  (!res.ok) {
            displayCouldNotConnect()
            throw new Error("FAILED_CONNECTION")
        }
        return res.json()
    
    // Update the cache
    }).then(data => {
        localStorage.setItem("cal", JSON.stringify(data["events"]))
        localStorage.setItem("etag", data["etag"])

        
        cacheStatus.textContent = "Calendar is Synced"
        console.log("Cache updated")

    }).catch(err => {
        if (err.message == "MODERN") {
            cacheStatus.textContent = "Calendar is Synced"
            console.log("Cache is modern")
        }
        else {
            cacheStatus.textContent = "Cache may be outdated"
            console.log("Could not update the cache: " + err.message)
        }
    })
}

const rewindFlags = ["period", "lunch", "break", 
    "homeroom", "meeting", "chapel, assembly"]
async function getSchedule(targetDate) {
    const schedule = [];
    const cal = JSON.parse(localStorage.getItem("cal") || "[]");
    console.log(`Searching for date: ${targetDate}`);

    let eventDate = "yyyy-mm-dd" // placeholder
    for (const event of cal) {

       // schedule days are set to midnight - intended date
        const title = event.summary
        if (title.includes("Schedule") || title.includes("Holiday")
            || title.includes("BREAK") || title.includes("HOLIDAY")) {
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

function getWeekRange(date) {
  // Start from Sunday of the given date's week
  const startDate = new Date(date);
  const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  startDate.setDate(startDate.getDate() - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);

  // End at midnight transitioning into the next Sunday (or end of Saturday)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7); // Exactly 7 days later at midnight (00:00:00.000)

  return [startDate, endDate];
}

function isDateBetween(targetDate, startDate, endDate) {
  const target = new Date(targetDate).getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  // Handle case where startDate might be after endDate
  const minDate = Math.min(start, end);
  const maxDate = Math.max(start, end);

  return target >= minDate && target <= maxDate;
}

function getWeek(date) {
    const cal = JSON.parse(localStorage.getItem("cal") || "[]");
    const range = getWeekRange(date)
    let week = []
    for (const event of cal) {
        const title = event.summary
        if ((title.includes("Schedule") || title.includes("Holiday")
            || title.includes("BREAK") || title.includes("HOLIDAY")) == false) {
            continue
        }
        const eventDate = new Date(event.start)
        if (isDateBetween(eventDate, range[0], range[1]))
        {week.push(event)}
    }
    return week
}

function getWeekday(date) {
    const weekday = date.toLocaleDateString('en-US', {
        weekday: 'long', 
        timeZone: "UTC" }).toLowerCase();
    return weekday
}

function getWeekdayAbrv(weekday) {
    return weekday.charAt(0).toUpperCase() + weekday.slice(1, 3)
}

function renderWeek(week) {
    const dayElements = document.getElementById("week-schedule").children

    for (const element of dayElements) {
        element.setAttribute("fill", "none")
    }

    for (const event of week) {
        const eventDate = new Date(event.start)
        const weekday = getWeekday(eventDate)
        const element = document.getElementById(weekday)
        element.setAttribute("fill", "full")

        element.textContent = getWeekdayAbrv(weekday) + ". " + event.summary
    }

    for (const element of dayElements) {
        if (element.getAttribute("fill") == "none") {
            element.textContent = getWeekdayAbrv(element.textContent) + ". " + "No Data"
        }
    }
}

function renderSchedule(schedule) {
    const scheduleElement = document.getElementById("schedule");
    const scheduleType = document.getElementById("day-schedule")

    // The first event is always the schedule type, splice it
    let scheduleTypeData = schedule.splice(0, 1)[0]
    scheduleType.textContent = scheduleTypeData.summary
    const scheduleDate = new Date(scheduleTypeData.start)
    renderWeek(getWeek(scheduleDate))

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

function setScheduleLoading(dateString) {
    renderDate(new Date(dateString.replaceAll("-", "/"))) // Filler
    const scheduleType = document.getElementById("day-schedule")
    scheduleType.textContent = "Loading Schedule..."
}

function setScheduleNone(dateString) {
    renderDate(new Date(dateString.replaceAll("-", "/"))) // Filler
    const scheduleElement = document.getElementById("schedule");
    scheduleElement.replaceChildren()
    const scheduleType = document.getElementById("day-schedule")
    scheduleType.textContent = "No Data "
}


async function pollData(dateString) {
    setScheduleLoading(dateString) // relies on the next line to load
    await checkConnection(false) // check for possible inconsistencies
    const schedule = await getSchedule(dateString)
    if (schedule.length == 0) {setScheduleNone(dateString); return}
    else {renderSchedule(schedule)}
}

// NOTE: corresponds to the system local timezone - shouldn't matter for intended users
function pollToday(){
    const now = new Date()
    let todayString = now.toLocaleDateString("en-ZA", { // convert to yyyy-mm-dd
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).replaceAll("/", "-")

    const buttonInput = document.getElementById("load-schedule-input")
    buttonInput.setAttribute("value", todayString)
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
function checkConnection(ui=true){
    if(ui){checkConnectionUI()}
    const status = document.getElementById("connection-status")
    const wasOffline = !connectionStatus
    
    return fetch(`${API_BASE_URL}/hello`)
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
        })
}

async function main(){
    syncStyle()
    checkConnection()
    await updateCache()
    pollToday()
}

main()
