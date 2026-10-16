const API_BASE_URL = "http://127.0.0.1:5000"

// Refreshing the page through the "Load Schedule" button
const bGetSchedule = document.getElementById("load-schedule")
const iGetSchedule = document.getElementById("load-schedule-input")
bGetSchedule.addEventListener("click", () => {
    pollData(iGetSchedule.value)
})

async function updateCache() {
    let etag = localStorage.getItem("etag")
    if (!etag){etag = "none"}
    
    const response = await fetch(
        `${API_BASE_URL}/events/`,
        {
        method: "POST", 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({"etag": etag})
        }
    )
    
    if (response.status == 304) {return} // Do nothing if the cache is modern
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

function getHawaiiDate(dateString) {
    const date = new Date(dateString);

    // Reject invalid date strings
    if (Number.isNaN(date.getTime())) {
        console.error("Invalid event date:", dateString);
        return null;
    }

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Pacific/Honolulu",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);

    const values = Object.fromEntries(
        parts.map(part => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}`;
}

async function getSchedule(targetDate) {
    const schedule = [];
    const cal = JSON.parse(localStorage.getItem("cal") || "[]");
    console.log(cal)

    console.log(`Searching for date: ${targetDate}`);

    for (const event of cal) {
        let eventDate = "yyyy-mm-dd" // placeholder
        if (event.summary.includes("Schedule")) {
            eventDate = event.date
        }
        else {
            let eventDateObj = new Date(event.start)
            eventDateObj.setHours(eventDateObj.getHours() - 9)
            eventDate = eventDateObj.toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            })
            eventDate = eventDate.replaceAll("/", "-")
            
            //eventDate = event.date
        }
    
        if (eventDate === targetDate) {
            schedule.push(event);
        }
    }

    console.log(schedule);
    return schedule;
}

function renderDate(date) {
    const dateElement = document.getElementById("current-date");
    
    date.setHours(date.getHours() + 10) // schedule dates are at 00, gets pushed back
    dateElement.textContent = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        //timeZone: "Pacific/Honolulu"
    });
}

function renderSchedule(schedule) {
    if (schedule.length == 0) {throw new Error("No Schedule was found")}

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
        heading.textContent = `${period.summary}${getOrdinalSuffix(period.number)} Period`;

        const subject = document.createElement("h3");
        subject.textContent = period.name;
        
        // display times
        let jsStart = new Date(period.start); jsStart.setHours(jsStart.getHours() + 9)
        let jsEnd = new Date(period.end); jsEnd.setHours(jsEnd.getHours() + 9)
        const time = document.createElement("p");
        time.textContent =
            `${jsStart.toLocaleTimeString()} – ${jsEnd.toLocaleTimeString()}`;

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

async function pollData(dateString) {
    await updateCache()
    const schedule = await getSchedule(dateString)
    renderSchedule(schedule)
}
