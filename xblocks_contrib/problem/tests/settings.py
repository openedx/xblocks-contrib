#################### CAPA External Code Evaluation #############################
XQUEUE_WAITTIME_BETWEEN_REQUESTS = 5  # seconds
XQUEUE_INTERFACE = {
    'url': 'http://localhost:18040',
    'basic_auth': ['edx', 'edx'],
    'django_auth': {
        'username': 'lms',
        'password': 'password'
    }
}

ENABLE_CODEJAIL_REST_SERVICE = False
CODE_JAIL_REST_SERVICE_REMOTE_EXEC = 'xblocks_contrib.problem.capa.safe_exec.remote_exec.send_safe_exec_request_v0'
CODE_JAIL_REST_SERVICE_HOST = 'http://127.0.0.1:8550'
CODE_JAIL_REST_SERVICE_CONNECT_TIMEOUT = 0.5
CODE_JAIL_REST_SERVICE_READ_TIMEOUT = 3.5

FEATURES = {}

ROOT_URLCONF = 'cms.urls'

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "submissions"
]
