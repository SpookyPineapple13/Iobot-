from flask import Blueprint

bp = Blueprint("events", __name__, url_prefix="/events")

@bp.route("/")
def get_events():
    return "Events page"