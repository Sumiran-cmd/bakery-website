import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Never run with debug=True in production.
    # Use a production WSGI server (gunicorn/waitress) for deployment.
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
