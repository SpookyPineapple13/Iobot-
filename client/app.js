const API_BASE_URL = "http://127.0.0.1:5000"
let connectionStatus = false

// Refreshing the page through the "Load Schedule" button
const bGetSchedule = document.getElementById("load-schedule")
const iGetSchedule = document.getElementById("load-schedule-input")
bGetSchedule.addEventListener("click", () => {
    pollData(iGetSchedule.value)
})

async function updateCache() {
    console.log("Checking Cache")
    let etag = localStorage.getItem("etag")
    if (!etag){etag = "none"}
    
    const response = await fetch(
        `${API_BASE_URL}/schedule/`,
        {
        method: "POST", 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({"etag": etag})
        }
    )
    
    if (response.status == 304) {console.log("Cache is modern"); return} // Do nothing if the cache is modern
    else if  (!response.ok) {
        throw new Error("Could not connect to the server")
    }

    console.log("Updated cache")

    // Update the cache
    const responseJson = await response.json()
    localStorage.setItem("cal", JSON.stringify(responseJson["events"]))
    localStorage.setItem("etag", responseJson["etag"])
    return 
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
        heading.textContent = `${period.summary};

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

// Check for connection, then poll today
function checkConnection(){
    const scheduleType = document.getElementById("day-schedule")
    const responsePromise = fetch(`${API_BASE_URL}/hello`);

    responsePromise
        .then((res) => {
            
            if (!res.ok) {
                connectionStatus = false;
                scheduleType.textContent = "Could not connect to Server";
                throw new Error("Could not connect to the server");
            }
            
            connectionStatus = true;
            scheduleType.textContent = "Connected to Server";
        })
        .catch((error) => {console.error(error);});
    }

async function main(){
    checkConnection()
    await updateCache()
    pollToday()
}

main()
