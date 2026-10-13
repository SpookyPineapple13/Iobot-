from flask import Blueprint, jsonify
from pathlib import Path
from ical.calendar_stream import IcsCalendarStream
from ical.exceptions import CalendarParseError
from datetime import datetime


bp = Blueprint("events", __name__, url_prefix="/events")
ical_url = "https://calendar.google.com/calendar/ical/iolani.org_ds7482aj4fh4uortauf8vuquso%40group.calendar.google.com/public/basic.ics"

def parse_event(event):
    event_dict = {
        "summary": event.summary,
        "date": event.dtstart.strftime("%Y-%m-%d %H:%M:%S"),
        "start": event.start,
        "end": event.end,
    }
    return event_dict

@bp.route("/")
async def get_events():
    cal = await IcsCalendarStream.calendar_from_url(ical_url)
    events = []
    for event in cal.timeline:
        events.append(parse_event(event))
        break

    return jsonify(events)