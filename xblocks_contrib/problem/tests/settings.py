from pathlib import Path

LMS_ROOT_URL = "http://testserver"
# CAPA External Code Evaluation #
XQUEUE_WAITTIME_BETWEEN_REQUESTS = 5  # seconds
XQUEUE_INTERFACE = {
    "url": "http://localhost:18040",
    "basic_auth": ["edx", "edx"],
    "django_auth": {"username": "lms", "password": "password"},
}

ENABLE_CODEJAIL_REST_SERVICE = False
CODE_JAIL_REST_SERVICE_REMOTE_EXEC = "xblocks_contrib.problem.capa.safe_exec.remote_exec.send_safe_exec_request_v0"
CODE_JAIL_REST_SERVICE_HOST = "http://127.0.0.1:8550"
CODE_JAIL_REST_SERVICE_CONNECT_TIMEOUT = 0.5
CODE_JAIL_REST_SERVICE_READ_TIMEOUT = 3.5

FEATURES = {}

ROOT_URLCONF = "xblocks_contrib.problem.tests.testurls"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "submissions",
    # "xblocks_contrib.problem.capa",  # 👈 add this to ensure app templates are discoverable
]

BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATE_DIR = BASE_DIR / "capa" / "templates"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            TEMPLATE_DIR,
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            # 👇 ADD THIS 'loaders' KEY AND VALUE
            "loaders": [
                "django.template.loaders.filesystem.Loader",
                "django.template.loaders.app_directories.Loader",
            ],
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
        "NAME": "django",
    },
]
