"""
Common utility functions for XBlocks.
"""

from django.conf import settings


def get_static_resource_path(pipeline_path, dev_path):
    """
    Return the appropriate static resource path for the current environment.

    When the Django pipeline is enabled or REQUIRE_DEBUG is False, returns
    pipeline_path (static asset path, e.g. CDN in production). Otherwise returns
    dev_path (local unpacked asset path).

    For more details, see platform's xblock_local_resource_url() in:
    https://github.com/openedx/openedx-platform/blob/master/openedx/core/lib/xblock_utils/__init__.py

    Arguments:
        pipeline_path (str): Path used when pipeline is enabled or not in debug.
        dev_path (str): Path used in dev/debug mode of runtime/openedx-platform

    Returns:
        str: The path to use for local_resource_url().
    """
    pipeline = getattr(settings, 'PIPELINE', {})
    if pipeline.get('PIPELINE_ENABLED', True) or not getattr(settings, 'REQUIRE_DEBUG', False):
        return pipeline_path
    return dev_path
