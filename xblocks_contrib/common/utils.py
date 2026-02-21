"""
Common utility functions for XBlocks.
"""

from django.conf import settings


def get_resource_url(xblock, path, package_scope=None):
    """
    Return the runtime URL for a static resource in this XBlock's package.

    When the Django pipeline is enabled or REQUIRE_DEBUG is False, uses the
    pipeline path (e.g. {package_scope}/public/{path}). Otherwise uses the
    dev path (e.g. public/{path}). See platform's xblock_local_resource_url() in:
    openedx/core/lib/xblock_utils/__init__.py

    Arguments:
        xblock: The XBlock instance (for runtime.local_resource_url).
        path (str): Relative path within the package, e.g. "css/video.css".
        package_scope (str): Package name prefix, e.g. "video". If None,
            both paths are "public/{path}"; otherwise pipeline adds the prefix.

    Returns:
        str: URL from xblock.runtime.local_resource_url() for the resource.
    """
    pipeline_path = dev_path = f"public/{path}"
    if package_scope:
        pipeline_path = f"{package_scope}/{pipeline_path}"
    pipeline = getattr(settings, 'PIPELINE', {})
    if pipeline.get('PIPELINE_ENABLED', True) or not getattr(settings, 'REQUIRE_DEBUG', False):
        resource_path = pipeline_path
    else:
        resource_path = dev_path
    return xblock.runtime.local_resource_url(xblock, resource_path)
