# NOTE: Code has been copied from the following source files
# https://github.com/openedx/edx-platform/blob/master/xmodule/video_block/video_utils.py
"""
Module contains utils specific for video_block but not for transcripts.
"""


import logging
from collections import OrderedDict
from urllib.parse import parse_qs, urlencode, urlparse, urlsplit, urlunsplit

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator

log = logging.getLogger(__name__)


def create_youtube_string(block):
    """
    Create a string of Youtube IDs from `block`'s metadata
    attributes. Only writes a speed if an ID is present in the
    block.  Necessary for backwards compatibility with XML-based
    courses.
    """
    youtube_ids = [
        block.youtube_id_0_75,
        block.youtube_id_1_0,
        block.youtube_id_1_25,
        block.youtube_id_1_5
    ]
    youtube_speeds = ['0.75', '1.00', '1.25', '1.50']
    return ','.join([
        ':'.join(pair)
        for pair
        in zip(youtube_speeds, youtube_ids)
        if pair[1]
    ])


def rewrite_video_url(cdn_base_url, original_video_url):
    """
    Returns a re-written video URL for cases when an alternate source
    has been configured and is selected using factors like
    user location.

    Re-write rules for country codes are specified via the
    EDX_VIDEO_CDN_URLS configuration structure.

    :param cdn_base_url: The scheme, hostname, port and any relevant path prefix for the alternate CDN,
    for example: https://mirror.example.cn/edx
    :param original_video_url: The canonical source for this video, for example:
    https://cdn.example.com/edx-course-videos/VIDEO101/001.mp4
    :return: The re-written URL
    """

    if (not cdn_base_url) or (not original_video_url):
        return None

    parsed = urlparse(original_video_url)
    # Contruction of the rewrite url is intentionally very flexible of input.
    # For example, https://www.edx.org/ + /foo.html will be rewritten to
    # https://www.edx.org/foo.html.
    rewritten_url = cdn_base_url.rstrip("/") + "/" + parsed.path.lstrip("/")
    validator = URLValidator()

    try:
        validator(rewritten_url)
        return rewritten_url
    except ValidationError:
        log.warning("Invalid CDN rewrite URL encountered, %s", rewritten_url)

    # Mimic the behavior of removed get_video_from_cdn in this regard and
    # return None causing the caller to use the original URL.
    return None


def get_poster(video):
    """
    Generate poster metadata.

    youtube_streams is string that contains '1.00:youtube_id'

    Poster metadata is dict of youtube url for image thumbnail and edx logo
    """
    if not video.bumper.get("enabled"):
        return

    poster = OrderedDict({"url": "", "type": ""})

    if video.youtube_streams:
        youtube_id = video.youtube_streams.split('1.00:')[1].split(',')[0]
        poster["url"] = settings.YOUTUBE['IMAGE_API'].format(youtube_id=youtube_id)
        poster["type"] = "youtube"
    else:
        poster["url"] = "https://www.edx.org/sites/default/files/theme/edx-logo-header.png"
        poster["type"] = "html5"

    return poster


def format_xml_exception_message(location, key, value):
    """
    Generate exception message for VideoBlock class which will use for ValueError and UnicodeDecodeError
    when setting xml attributes.
    """
    exception_message = "Block-location:{location}, Key:{key}, Value:{value}".format(
        location=str(location),
        key=key,
        value=value
    )
    return exception_message


def set_query_parameter(url, param_name, param_value):
    """
    Given a URL, set or replace a query parameter and return the
    modified URL.
    """
    scheme, netloc, path, query_string, fragment = urlsplit(url)
    query_params = parse_qs(query_string)
    query_params[param_name] = [param_value]
    new_query_string = urlencode(query_params, doseq=True)

    return urlunsplit((scheme, netloc, path, new_query_string, fragment))


def deserialize_field(field, value):
    """
    Deserialize the string version to the value stored internally.

    Note that this is not the same as the value returned by from_json, as model types typically store
    their value internally as JSON. By default, this method will return the result of calling json.loads
    on the supplied value, unless json.loads throws a TypeError, or the type of the value returned by json.loads
    is not supported for this class (from_json throws an Error). In either of those cases, this method returns
    the input value.
    """
    try:
        deserialized = json.loads(value)
        if deserialized is None:
            return deserialized
        try:
            field.from_json(deserialized)
            return deserialized
        except (ValueError, TypeError):
            # Support older serialized version, which was just a string, not result of json.dumps.
            # If the deserialized version cannot be converted to the type (via from_json),
            # just return the original value. For example, if a string value of '3.4' was
            # stored for a String field (before we started storing the result of json.dumps),
            # then it would be deserialized as 3.4, but 3.4 is not supported for a String
            # field. Therefore field.from_json(3.4) will throw an Error, and we should
            # actually return the original value of '3.4'.
            return value

    except (ValueError, TypeError):
        # Support older serialized version.
        return value


def load_metadata_from_youtube(video_id, request):
    """
    Get metadata about a YouTube video.

    This method is used via the standalone /courses/yt_video_metadata REST API
    endpoint, or via the video XBlock as a its 'yt_video_metadata' handler.
    """
    metadata = {}
    status_code = 500
    if video_id and settings.YOUTUBE_API_KEY and settings.YOUTUBE_API_KEY != 'PUT_YOUR_API_KEY_HERE':
        yt_api_key = settings.YOUTUBE_API_KEY
        yt_metadata_url = settings.YOUTUBE['METADATA_URL']
        yt_timeout = settings.YOUTUBE.get('TEST_TIMEOUT', 1500) / 1000  # converting milli seconds to seconds

        headers = {}
        http_referer = None

        try:
            # This raises an attribute error if called from the xblock yt_video_metadata handler, which passes
            # a webob request instead of a django request.
            http_referer = request.META.get('HTTP_REFERER')
        except AttributeError:
            # So here, let's assume it's a webob request and access the referer the webob way.
            http_referer = request.referer

        if http_referer:
            headers['Referer'] = http_referer

        payload = {'id': video_id, 'part': 'contentDetails', 'key': yt_api_key}
        try:
            res = requests.get(yt_metadata_url, params=payload, timeout=yt_timeout, headers=headers)
            status_code = res.status_code
            if res.status_code == 200:
                try:
                    res_json = res.json()
                    if res_json.get('items', []):
                        metadata = res_json
                    else:
                        logging.warning('Unable to find the items in response. Following response '
                                        'was received: {res}'.format(res=res.text))
                except ValueError:
                    logging.warning('Unable to decode response to json. Following response '
                                    'was received: {res}'.format(res=res.text))
            else:
                logging.warning('YouTube API request failed with status code={status} - '
                                'Error message is={message}'.format(status=status_code, message=res.text))
        except (Timeout, ConnectionError):
            logging.warning('YouTube API request failed because of connection time out or connection error')
    else:
        logging.warning('YouTube API key or video id is None. Please make sure API key and video id is not None')

    return metadata, status_code
