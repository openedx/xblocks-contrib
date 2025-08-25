"""
Custom Django template filters for the capa XBlock.

This module defines filters for safely accessing dictionary values in templates
and removing markup from text.
"""

from django import template

from xblocks_contrib.problem.capa.util import remove_markup

register = template.Library()


@register.filter(name="remove_markup")
def remove_markup_filter(value):
    """
    Django template filter that removes markup from a string.
    """
    return remove_markup(value)


@register.filter
def dict_get(d, key):
    """
    Safe dict.get for Django templates.

    Returns the value for `key` if present in the dictionary `d`,
    otherwise returns an empty string.
    """
    if isinstance(d, dict):
        return d.get(key, "")
    return ""
