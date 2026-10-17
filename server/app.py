import os
import hashlib

from flask import Flask, jsonify, request, Response
from flask_cors import CORS 
from flask_caching import Cache
from ical.calendar_stream import IcsCalendarStream
from ical.exceptions import CalendarParseError
from flask_apscheduler import APScheduler
import requests

"""
STARTUP COMMAND
gunicorn "app:create_app() -w 1 --bind 0.0.0.0:$PORT
"""

cache = Cache()
scheduler = APScheduler()

ical_url = "https://calendar.google.com/calendar/ical/iolani.org_ds7482aj4fh4uortauf8vuquso%40group.calendar.google.com/public/basic.ics"

## Application factory 
def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev', # should be changed later 
        DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
        CACHE_TYPE="SimpleCache",
        CACHE_DEFAULT_TIMEOUT = 0 # default indefinite cache
    )

    cache.init_app(app) # initialize the cache
    scheduler.init_app(app) # initialize the cache update scheduler
    CORS(app, origins=["https://spookypineapple13.github.io/Iobot-/"]) # enable cross-origin sourcing
    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)

    # register blueprints
    from routes import schedule
    app.register_blueprint(schedule.bp)

    # check connection 
    @app.route('/hello')
    def checkConnection():
        return jsonify({
            "message": "Affirmative Server Connection"
        })

    # load the initial cache
    with app.app_context():
        load_calendar()

    scheduler.start()
    return app

def load_calendar():
    """Synchronously fetches and caches the iCal calendar."""
    try:
        response = requests.get(ical_url, timeout=60) # 60 second load-time alloted
        response.raise_for_status()
        ics_text = response.text

        # MD5 hash of raw calendar payload
        etag = hashlib.md5(ics_text.encode("utf-8")).hexdigest()

        # parse raw ICS content synchronously
        if etag != cache.get("etag"):
            cal = IcsCalendarStream.calendar_from_ics(ics_text)
            cache.set("ics_data", cal, timeout=0)
            cache.set("etag", etag, timeout=0)
            print("Calendar cache updated successfully.")
    except Exception as e:
        print(f"Error loading calendar: {e}")


def parse_event_to_dict(event):
    event_dict = {
        "summary": event.summary,
        "start": event.dtstart,
        "end": event.dtend,
        "date": event.dtstart.strftime("%Y-%m-%d"),
    }
    return event_dict

# Update the cache every 3 minutes
@scheduler.task('interval', id='update_cache', seconds=180, misfire_grace_time=900)
def periodic_task():
    load_calendar()
