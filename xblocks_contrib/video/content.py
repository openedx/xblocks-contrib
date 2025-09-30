from opaque_keys.edx.locator import AssetLocator

class StaticContent:  # lint-amnesty, pylint: disable=missing-class-docstring
    def __init__(self, loc, name, content_type, data, last_modified_at=None, thumbnail_location=None, import_path=None,
                 length=None, locked=False, content_digest=None):
        self.location = loc
        self.name = name  # a display string which can be edited, and thus not part of the location which needs to be fixed  # lint-amnesty, pylint: disable=line-too-long
        self.content_type = content_type
        self._data = data
        self.length = length
        self.last_modified_at = last_modified_at
        self.thumbnail_location = thumbnail_location
        # optional information about where this file was imported from. This is needed to support import/export
        # cycles
        self.import_path = import_path
        self.locked = locked
        self.content_digest = content_digest

    @staticmethod
    def compute_location(course_key, path, revision=None,
                         is_thumbnail=False):  # lint-amnesty, pylint: disable=unused-argument
        """
        Constructs a location object for static content.

        - course_key: the course that this asset belongs to
        - path: is the name of the static asset
        - revision: is the object's revision information
        - is_thumbnail: is whether or not we want the thumbnail version of this
            asset
        """
        path = path.replace('/', '_')
        return course_key.make_asset_key(
            'asset' if not is_thumbnail else 'thumbnail',
            AssetLocator.clean_keeping_underscores(path)
        ).for_branch(None)
