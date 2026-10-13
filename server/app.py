import os

from flask import (Flask, jsonify)
from flask_cors import CORS # type: ignore

## Application factory 
def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev', # should be changed later 
        DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
    )
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
