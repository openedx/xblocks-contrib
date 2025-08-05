import json

from collections import namedtuple
from urllib.parse import urlencode

from django.conf import settings
from django.utils.translation import gettext_lazy as _
from xblock.fields import Scope

# from openedx_learning.api import authoring as authoring_api

SharingSiteConfig = namedtuple(
    'SharingSiteConfig',
    [
        'name',
        'fa_icon_name',
        'url_param_name',
        'base_share_url',
        'additional_site_params'
    ],
    defaults=[{}]
)

TWITTER = SharingSiteConfig(
    name='twitter',
    fa_icon_name='fa-twitter-square',
    url_param_name='url',
    base_share_url='https://twitter.com/intent/tweet',
)

FACEBOOK = SharingSiteConfig(
    name='facebook',
    fa_icon_name='fa-facebook-square',
    url_param_name='u',
    base_share_url='https://www.facebook.com/sharer/sharer.php'
)

LINKEDIN = SharingSiteConfig(
    name='linkedin',
    fa_icon_name='fa-linkedin-square',
    url_param_name='url',
    base_share_url='https://www.linkedin.com/sharing/share-offsite/'
)

ALL_SHARING_SITES = [
    TWITTER,
    FACEBOOK,
    LINKEDIN,
]


def get_share_text(social_account_handle, organization_name):
    """
    Generate the text we will pre-populate when sharing a post to social media.

    NOTE: Most of the time, we will have all info of these, but have provided
    reasonable fallbacks in case some are missing.
    """
    if social_account_handle and organization_name:
        return _(
            "Here's a fun clip from a class I'm taking on {social_account_handle} from {organization_name}.\n\n"
        ).format(
            social_account_handle=social_account_handle,
            organization_name=organization_name,
        )
    elif social_account_handle:
        return _(
            "Here's a fun clip from a class I'm taking on {social_account_handle}.\n\n"
        ).format(social_account_handle=social_account_handle)
    elif organization_name:
        return _(
            "Here's a fun clip from a class I'm taking from {organization_name}.\n\n"
        ).format(organization_name=organization_name)
    else:
        return _(
            "Here's a fun clip from a class I'm taking on {platform_name}.\n\n"
        ).format(platform_name=settings.PLATFORM_NAME)


def sharing_url(video_public_url, sharing_site_config, organization=None):
    """
    Returns the sharing url with the appropriate parameters
    """
    share_params = {
        'utm_source': sharing_site_config.name,
        'utm_medium': 'social',
        'utm_campaign': 'social-share-exp',
        sharing_site_config.url_param_name: video_public_url
    }

    # Special handling for Twitter, pre-populate share text
    if sharing_site_config.name == "twitter":
        twitter_handle = settings.PLATFORM_TWITTER_ACCOUNT
        org_name = organization['name'] if organization else None
        share_params.update({"text": get_share_text(twitter_handle, org_name)})
    else:
        share_params.update(sharing_site_config.additional_site_params)

    return sharing_site_config.base_share_url + '?' + urlencode(share_params)


def sharing_sites_info_for_video(video_public_url, organization=None):
    """
    Returns a list of dicts, each containing the name, fa_icon_name, and sharing_url
    """
    result = []
    for sharing_site_config in ALL_SHARING_SITES:
        sharing_site_info = {
            'name': sharing_site_config.name,
            'fa_icon_name': sharing_site_config.fa_icon_name,
            'sharing_url': sharing_url(
                video_public_url,
                sharing_site_config,
                organization=organization
            ),
        }
        result.append(sharing_site_info)
    return result

def own_metadata(block):
    """
    Return a JSON-friendly dictionary that contains only non-inherited field
    keys, mapped to their serialized values
    """
    return block.get_explicitly_set_fields_by_scope(Scope.settings)

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
