const API_BASE_URL = "http://127.0.0.1:5000"

async function updateSchedule() {
    console.log("fetching schedule")
    const response = await fetch(
        `${API_BASE_URL}/events`
    )

    if (!response.ok) {
        serverMessage.textContent("Could not connect to the server")
        throw new Error("Could not connect to the server")
    }

    const schedule = await response.json()
    console.log(schedule)
    renderPeriods(schedule)
}

function renderDate() {
    const dateElement = document.getElementById("current-date");
    const now = new Date();

    dateElement.textContent = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

renderDate();

// Placeholder data
const periods = [
    {
        // Required parameters
        number: 1,
        startTime: "8:00 AM",
        endTime: "8:50 AM",
        
        // Optional / Customizable based on Login 
        name: "Computer Science",
        location: "Room 204",
        teacher: "Mr. Smith"
    },
    {
        number: 2,
        name: "Mathematics",
        startTime: "8:55 AM",
        endTime: "9:45 AM",
        location: "Room 112",
        teacher: "Mrs. Jones"
    },
    {
        number: 3,
        name: "Free Period",
        startTime: "9:50 AM",
        endTime: "10:40 AM",
        location: "",
        teacher: ""
    },
]


function renderPeriods(periods) {
    const schedule = document.getElementById("schedule");

    // Clear previously rendered periods.
    schedule.replaceChildren();

    for (const period of periods) {
        const card = document.createElement("article");
        card.classList.add("period-card");

        const heading = document.createElement("h2");
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

        schedule.append(card);
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

async function pollData() {
  try {
    await updateSchedule()
  } catch (error) {
    console.error('Fetch error:', error);
  } finally {
    setTimeout(pollData, 5000); // Wait 5 seconds after completion
  }
}

pollData();
