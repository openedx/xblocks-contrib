"""
Helpers for html temporary
"""

import datetime
import json
import logging
import os

from django.core.serializers.json import DjangoJSONEncoder
from lxml import etree
from lxml.etree import ElementTree, XMLParser
from opaque_keys.edx.keys import CourseKey, UsageKey
from xblock.core import XML_NAMESPACES
from xblock.fields import Scope

log = logging.getLogger(__name__)

# assume all XML files are persisted as utf-8.
EDX_XML_PARSER = XMLParser(dtd_validation=False, load_dtd=False, remove_blank_text=True, encoding="utf-8")


def name_to_pathname(name):
    """
    Convert a location name for use in a path: replace ':' with '/'.
    This allows users of the xml format to organize content into directories
    """
    return name.replace(":", "/")


def serialize_field(value):
    """
    Return a string version of the value (where value is the JSON-formatted, internally stored value).

    If the value is a string, then we simply return what was passed in.
    Otherwise, we return json.dumps on the input value.
    """
    if isinstance(value, str):
        return value
    elif isinstance(value, datetime.datetime):
        if value.tzinfo is not None and value.utcoffset() is None:
            return value.isoformat() + "Z"
        return value.isoformat()

    return json.dumps(value, cls=EdxJSONEncoder)


class XmlMixin:
    """
    Class containing XML parsing functionality shared between XBlock and XModuleDescriptor.
    """

    metadata_to_strip = (
        "data_dir",
        "tabs",
        "grading_policy",
        "discussion_blackouts",
        # VS[compat]
        # These attributes should have been removed from here once all 2012-fall courses imported into
        # the CMS and "inline" OLX format deprecated. But, it never got deprecated. Moreover, it's
        # widely used to this date. So, we still have to strip them. Also, removing of "filename"
        # changes OLX returned by `/api/olx-export/v1/xblock/{block_id}/`, which indicates that some
        # places in the platform rely on it.
        "course",
        "org",
        "url_name",
        "filename",
        # Used for storing xml attributes between import and export, for roundtrips
        "xml_attributes",
        # Used by _import_xml_node_to_parent in cms/djangoapps/contentstore/helpers.py to prevent
        # XmlMixin from treating some XML nodes as "pointer nodes".
        "x-is-pointer-node",
    )

    # This is a categories to fields map that contains the block category specific fields which should not be
    # cleaned and/or override while adding xml to node.
    metadata_to_not_to_clean = {
        # A category `video` having `sub` and `transcripts` fields
        # which should not be cleaned/override in an xml object.
        "video": ("sub", "transcripts")
    }

    metadata_to_export_to_policy = ("discussion_topics",)

    @classmethod
    def clean_metadata_from_xml(cls, xml_object, excluded_fields=()):
        """
        Remove any attribute named for a field with scope Scope.settings from the supplied
        xml_object
        """
        for field_name, field in cls.fields.items():
            if (
                field.scope == Scope.settings
                and field_name not in excluded_fields
                and xml_object.get(field_name) is not None
            ):
                del xml_object.attrib[field_name]

    @classmethod
    def _format_filepath(cls, category, name):
        return f"{category}/{name}.{cls.filename_extension}"

    def export_to_file(self):
        """If this returns True, write the definition of this block to a separate
        file.

        NOTE: Do not override this without a good reason.  It is here
        specifically for customtag...
        """
        return True

    def add_xml_to_node(self, node):
        """
        For exporting, set data on `node` from ourselves.
        """
        # Get the definition
        xml_object = self.definition_to_xml(self.runtime.export_fs)

        # If xml_object is None, we don't know how to serialize this node, but
        # we shouldn't crash out the whole export for it.
        if xml_object is None:
            return

        for aside in self.runtime.get_asides(self):
            if aside.needs_serialization():
                aside_node = etree.Element("unknown_root", nsmap=XML_NAMESPACES)
                aside.add_xml_to_node(aside_node)
                xml_object.append(aside_node)

        not_to_clean_fields = self.metadata_to_not_to_clean.get(self.category, ())
        self.clean_metadata_from_xml(xml_object, excluded_fields=not_to_clean_fields)

        # Set the tag on both nodes so we get the file path right.
        xml_object.tag = self.category
        node.tag = self.category

        # Add the non-inherited metadata
        for attr in sorted(own_metadata(self)):
            # don't want e.g. data_dir
            if (
                attr not in self.metadata_to_strip
                and attr not in self.metadata_to_export_to_policy
                and attr not in not_to_clean_fields
            ):
                val = serialize_field(self.fields[attr].to_json(getattr(self, attr)))
                try:
                    xml_object.set(attr, val)
                except Exception:  # pylint: disable=broad-except
                    logging.exception(
                        "Failed to serialize metadata attribute %s with value %s in module %s. "
                        "This could mean data loss!!!",
                        attr,
                        val,
                        self.url_name,
                    )

        for key, value in self.xml_attributes.items():
            if key not in self.metadata_to_strip:
                xml_object.set(key, serialize_field(value))

        if self.export_to_file():
            # Write the definition to a file
            url_path = name_to_pathname(self.url_name)
            # if folder is course then create file with name {course_run}.xml
            filepath = self._format_filepath(
                self.category,
                self.location.run if self.category == "course" else url_path,
            )
            self.runtime.export_fs.makedirs(os.path.dirname(filepath), recreate=True)
            with self.runtime.export_fs.open(filepath, "wb") as fileobj:
                ElementTree(xml_object).write(fileobj, pretty_print=True, encoding="utf-8")
        else:
            # Write all attributes from xml_object onto node
            node.clear()
            node.tag = xml_object.tag
            node.text = xml_object.text
            node.tail = xml_object.tail
            node.attrib.update(xml_object.attrib)
            node.extend(xml_object)

        # Do not override an existing value for the course.
        if not node.get("url_name"):
            node.set("url_name", self.url_name)

        # Special case for course pointers:
        if self.category == "course":
            # add org and course attributes on the pointer tag
            node.set("org", self.location.org)
            node.set("course", self.location.course)


class EdxJSONEncoder(DjangoJSONEncoder):
    """
    Custom JSONEncoder that handles `Location` and `datetime.datetime` objects.

    `Location`s are encoded as their url string form, and `datetime`s as
    ISO date strings
    """

    def default(self, o):
        if isinstance(o, (CourseKey, UsageKey)):
            return str(o)
        elif isinstance(o, datetime.datetime):
            if o.tzinfo is not None:
                if o.utcoffset() is None:
                    return o.isoformat() + "Z"
                else:
                    return o.isoformat()
            else:
                return o.isoformat()
        else:
            return super().default(o)


def own_metadata(block):
    """
    Return a JSON-friendly dictionary that contains only non-inherited field
    keys, mapped to their serialized values
    """
    return block.get_explicitly_set_fields_by_scope(Scope.settings)
