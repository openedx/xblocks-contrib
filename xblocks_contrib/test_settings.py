"""
Minimal Django settings for running tests on xblocks_contrib.
"""

from pathlib import Path

from django.http import HttpResponse
from django.urls import re_path

BASE_DIR = Path(__file__).resolve().parent.parent
INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "submissions",
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
    }
}


def dummy_callback(_request, *_args, **_kwargs):
    """
    Minimal placeholder view for test URL patterns.
    Underscored arguments silence lint warnings for unused variables.
    """
    return HttpResponse("OK")


ROOT_URLCONF = type(
    "URLConf",
    (),
    {
        "urlpatterns": [
            re_path(
                r"^courses/(?P<course_id>.+)/xqueue/(?P<userid>[^/]+)/(?P<mod_id>.+)/(?P<dispatch>[^/]+)$",
                dummy_callback,
                name="xqueue_callback",
            ),
        ]
    },
)

FEATURES = {}

LMS_ROOT_URL = "http://localhost:8000"
CODE_JAIL_REST_SERVICE_REMOTE_EXEC = "xblocks_contrib.problem.capa.safe_exec.remote_exec.send_safe_exec_request_v0"
CODE_JAIL_REST_SERVICE_CONNECT_TIMEOUT = 0.5
CODE_JAIL_REST_SERVICE_READ_TIMEOUT = 3.5
CODE_JAIL_REST_SERVICE_HOST = "http://127.0.0.1:8550"

XQUEUE_WAITTIME_BETWEEN_REQUESTS = 5
XQUEUE_INTERFACE = {
    "url": "http://sandbox-xqueue.edx.org",
    "django_auth": {
        "username": "lms",
        "password": "***REMOVED***",
    },
    "basic_auth": ("anant", "agarwal"),
}

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            BASE_DIR / "xblocks_contrib" / "problem" / "capa" / "templates",
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
            ],
        },
    },
]
