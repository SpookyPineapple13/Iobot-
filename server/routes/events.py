from flask import Blueprint, request, jsonify
from pathlib import Path
from ical.calendar_stream import IcsCalendarStream
from ical.exceptions import CalendarParseError
from datetime import datetime, date

import sys

# Get the absolute path of the parent directory (1 level up)
parent_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(parent_dir))

from app import cache, parse_event_to_dict

bp = Blueprint("events", __name__, url_prefix="/events")
ical_url = "https://calendar.google.com/calendar/ical/iolani.org_ds7482aj4fh4uortauf8vuquso%40group.calendar.google.com/public/basic.ics"
today_schedule = []

# def parse_event_to_dict(event):
#     event_dict = {
#         "summary": event.summary,
#         "date": event.dtstart.strftime("%Y-%m-%d"),
#         "start": event.start,
#         "end": event.end,
#     }
#     return event_dict

@bp.route("/", methods=["POST"])
async def get_events():
    # Grab the payload
    data = request.json or {}
    target_date = data.get("dateRequest")

    # Grab the calendar - abt 20s
    cal = cache.get("ics_data")
    events = []

    # Parse and send today's events to the client
    for event in cal.timeline:
        eparsed = parse_event_to_dict(event)

        if eparsed["date"] == target_date:
            events.append(eparsed)
        elif events and eparsed["date"] > target_date:
            break

    return jsonify(events)