import os
import hashlib
import asyncio

from flask import Flask, jsonify, request, Response
from flask_cors import CORS 
from flask_caching import Cache
from ical.calendar_stream import IcsCalendarStream
from ical.exceptions import CalendarParseError

cache = Cache()

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

    cache.__init__(app) # initialize the cache
    asyncio.run(load_calendar()) # create the initial cache
    CORS(app) # enable cross-origin sourcing for all routes

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    os.makedirs(app.instance_path, exist_ok=True)

    # register blueprints
    from routes import events
    app.register_blueprint(events.bp)

    # check connection 
    @app.route('/hello')
    def checkConnection():
        return jsonify({
            "message": "Affirmative Server Connection"
        })

    return app

async def load_calendar():
    print("Loading calendar")
    cal = await IcsCalendarStream.calendar_from_url(ical_url)
    etag = hashlib.md5(str(cal).encode("utf-8")).hexdigest() # MD5 hash
    print(etag)

    if not (etag == cache.get("etag")):
        cache.set("ics_data", cal, timeout=0)
        cache.set("etag", etag, timeout=0)
    
    print("[Background] Updated ICS Cache and ETag")

def parse_event_to_dict(event):
    event_dict = {
        "summary": event.summary,
        "start": event.dtstart,
        "end": event.dtend,
        "date": event.dtstart.strftime("%Y-%m-%d"),
    }
    return event_dict
