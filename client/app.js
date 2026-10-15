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

    if (!response.ok) {
        throw new Error("Could not connect to the server")
    }
    
    if (response.status == 304) {return} // Do nothing if the cache is modern

    // Update the cache
    const responseJson = await response.json()
    localStorage.setItem("cal", responseJson["events"])
    localStorage.setItem("etag", responseJson["etag"])
    return 
}

async function getSchedule(dateString) {
    console.log(`Fetching Schedule for ${dateString}`)
    const response = await fetch(
        `${API_BASE_URL}/events/`,
        {
        method: "POST", 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({dateRequest: dateString})
        }
    )

    if (!response.ok) {
        serverMessage.textContent("Could not connect to the server")
        throw new Error("Could not connect to the server")
    }

    const schedule = await response.json()
    return schedule
}

function renderDate(date) {
    console.log(date)
    const stringDate = date.toISOString()
    const dateElement = document.getElementById("current-date");
    dateElement.textContent = date
    // Should check for better quality
    //dateElement.textContent = date.toLocaleDateString("en-US", {
    //     weekday: "long",
    //     year: "numeric",
    //     month: "long",
    //     day: "numeric"
    // });
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
        heading.textContent = `${period.summary}${getOrdinalSuffix(period.number)} Period`;

        const subject = document.createElement("h3");
        subject.textContent = period.name;

        const time = document.createElement("p");
        time.textContent =
            `${period.start} – ${period.end}`;

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
}
