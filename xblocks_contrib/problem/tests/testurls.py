from django.http import HttpResponse
from django.urls import path, re_path


def dummy_callback(request, *args, **kwargs):
    return HttpResponse("OK")


urlpatterns = [
    # minimal callback that matches CAPA reverse() kwargs
    re_path(
        r"xqueue/callback/(?P<course_id>[^/]+)/(?P<userid>[^/]+)/(?P<mod_id>.+)/(?P<dispatch>[^/]+)/$",
        dummy_callback,
        name="xqueue_callback",
    ),
]
