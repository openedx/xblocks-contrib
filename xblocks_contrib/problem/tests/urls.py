"""
URL configuration for test project.
"""

from django.http import HttpResponse
from django.urls import re_path


def dummy_callback(request, *args, **kwargs):
    return HttpResponse("OK")


urlpatterns = [
    re_path(
        r"^courses/(?P<course_id>.+)/xqueue/(?P<userid>[^/]+)/(?P<mod_id>.+)/(?P<dispatch>[^/]+)$",
        dummy_callback,
        name="xqueue_callback",
    ),
]
