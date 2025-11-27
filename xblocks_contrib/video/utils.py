import json

from xblock.fields import Scope
from django.conf import settings
import requests
import logging
from requests.exceptions import Timeout


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

def own_metadata(block):
    """
    Return a JSON-friendly dictionary that contains only non-inherited field
    keys, mapped to their serialized values
    """
    return block.get_explicitly_set_fields_by_scope(Scope.settings)

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
