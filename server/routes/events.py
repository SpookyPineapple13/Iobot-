from flask import Blueprint, request, jsonify
from pathlib import Path
from ical.calendar_stream import IcsCalendarStream
from ical.exceptions import CalendarParseError
from datetime import datetime, date

bp = Blueprint("events", __name__, url_prefix="/events")
ical_url = "https://calendar.google.com/calendar/ical/iolani.org_ds7482aj4fh4uortauf8vuquso%40group.calendar.google.com/public/basic.ics"
today_schedule = []

def parse_event(event):
    event_dict = {
        "summary": event.summary,
        "date": event.dtstart.strftime("%Y-%m-%d"),
        "start": event.start,
        "end": event.end,
    }
    return event_dict

@bp.route("/", methods=["POST"])
async def get_events():
    # Grab the payload
    data = request.json or {}
    target_date = data.get("dateRequest")

    # Grab the calendar - abt 20s
    cal = await IcsCalendarStream.calendar_from_url(ical_url)
    events = []

    # Parse and send today's events to the client
    for event in cal.timeline:
        eparsed = parse_event(event)

        if eparsed["date"] == target_date:
            events.append(eparsed)
        elif events and eparsed["date"] > target_date:
            break

    return jsonify(events)