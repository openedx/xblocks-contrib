"""
Support for inheritance of fields down an XBlock hierarchy.
"""


from xblock.runtime import KeyValueStore


class InheritanceKeyValueStore(KeyValueStore):
    """
    Common superclass for kvs's which know about inheritance of settings. Offers simple
    dict-based storage of fields and lookup of inherited values.

    Note: inherited_settings is a dict of key to json values (internal xblock field repr)

    Using this KVS is an alternative to using InheritingFieldData(). That one works with any KVS, like
    DictKeyValueStore, and doesn't require any special behavior. On the other hand, this InheritanceKeyValueStore only
    does inheritance properly if you first use compute_inherited_metadata() to walk the tree of XBlocks and pre-compute
    the inherited metadata for the whole tree, storing it in the inherited_settings field of each instance of this KVS.

    🟥 Warning: Unlike the base class, this KVS makes the assumption that you're using a completely separate KVS
       instance for every XBlock, so that we only have to look at the "field_name" part of the key. You cannot use this
       as a drop-in replacement for DictKeyValueStore for this reason.
    """
    def __init__(self, initial_values=None, inherited_settings=None):
        super().__init__()
        self.inherited_settings = inherited_settings or {}
        self._fields = initial_values or {}

    def get(self, key):
        return self._fields[key.field_name]

    def set(self, key, value):
        # xml backed courses are read-only, but they do have some computed fields
        self._fields[key.field_name] = value

    def delete(self, key):
        del self._fields[key.field_name]

    def has(self, key):
        return key.field_name in self._fields

    def default(self, key):
        """
        Check to see if the default should be from inheritance. If not
        inheriting, this will raise KeyError which will cause the caller to use
        the field's global default.
        """
        return self.inherited_settings[key.field_name]
