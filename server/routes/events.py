from flask import Blueprint, jsonify
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

@bp.route("/")
async def get_events():
    cal = await IcsCalendarStream.calendar_from_url(ical_url)
    events = []
    found_range = False
    target_date = "2026-10-20"

    # Parse and send today's events to the client
    for event in cal.timeline:
        eparsed = parse_event(event)

        if eparsed["date"] == target_date:
            events.append(eparsed)
        elif events and eparsed["date"] > target_date:
            break

    return jsonify(events)