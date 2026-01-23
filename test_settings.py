"""
Minimal Django settings for running tests on xblocks_contrib.
"""

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "edxval",
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
    }
}

TRANSCRIPT_LANG_CACHE_TIMEOUT = 60 * 60 * 24  # 24 hours