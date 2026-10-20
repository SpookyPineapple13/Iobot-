from flask import Blueprint, request, jsonify
from pathlib import Path
from ical.calendar_stream import IcsCalendarStream
from ical.exceptions import CalendarParseError
from datetime import datetime, date

import sys

# Get the absolute path of the parent directory (1 level up)
parent_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(parent_dir))

from server.app import cache, parse_event_to_dict

bp = Blueprint("schedule", __name__, url_prefix="/schedule")
ical_url = "https://calendar.google.com/calendar/ical/iolani.org_ds7482aj4fh4uortauf8vuquso%40group.calendar.google.com/public/basic.ics"

@bp.route("/", methods=["POST"])
def get_events():
    # Grab the payload
    data = request.json or {}
    etag = data.get("etag")

    # Tell the client to use its current cache if its etag is up to date
    if etag == cache.get("etag"):
        return '', 304

    # Send the server's cached data
    body = {}
    events = []
    freshEtag = ""

    # Parse and send the entire parsed calendar to the client
    cal = cache.get("ics_data")
    for event in cal.timeline:
        eparsed = parse_event_to_dict(event)
        events.append(eparsed)
    body["events"] = events

    # Send the updated etag
    freshEtag = cache.get("etag")
    body["etag"] = freshEtag

    return jsonify(body)
