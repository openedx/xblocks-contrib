"""
HTML XBlock module for displaying raw HTML content.
This XBlock allows users to embed HTML content inside courses.
"""

import copy
import logging
import os
import re
import sys
import uuid

from django.conf import settings
from django.utils.translation import gettext_noop as _
from fs.errors import ResourceNotFound
from lxml import etree
from opaque_keys.edx.keys import CourseKey, UsageKey
from opaque_keys.edx.locator import LibraryLocatorV2
from path import Path as path
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Boolean, Dict, List, Scope, String, UserScope
from xblock.utils.resources import ResourceLoader

from xblocks_contrib.utils import check_html, escape_html_characters, name_to_pathname, stringify_children

from .xml import XmlMixin

log = logging.getLogger(__name__)

resource_loader = ResourceLoader(__name__)

# The global (course-agnostic) anonymous user ID for the user.
ATTR_KEY_DEPRECATED_ANONYMOUS_USER_ID = "edx-platform.deprecated_anonymous_user_id"


@XBlock.needs("i18n")
@XBlock.needs("user")
class HtmlBlock(XmlMixin, XBlock):
    """
    The HTML XBlock
    This provides the base class for all Html-ish blocks (including the HTML XBlock).
    """

    # Indicates that this XBlock has been extracted from edx-platform.
    is_extracted = True

    display_name = String(
        display_name=_("Display Name"),
        help=_("The display name for this component."),
        scope=Scope.settings,
        # it'd be nice to have a useful default but it screws up other things; so,
        # use display_name_with_default for those
        default=_("Text"),
    )
    data = String(
        help=_("Html contents to display for this block"),
        default="",
        scope=Scope.content,
    )
    source_code = String(
        help=_("Source code for LaTeX documents. This feature is not well-supported."), scope=Scope.settings
    )
    use_latex_compiler = Boolean(help=_("Enable LaTeX templates?"), default=False, scope=Scope.settings)
    editor = String(
        help=_(
            "Select Visual to enter content and have the editor automatically create the HTML. Select Raw to edit "
            "HTML directly. If you change this setting, you must save the component and then re-open it for editing."
        ),
        display_name=_("Editor"),
        default="visual",
        values=[{"display_name": _("Visual"), "value": "visual"}, {"display_name": _("Raw"), "value": "raw"}],
        scope=Scope.settings,
    )

    ENABLE_HTML_XBLOCK_STUDENT_VIEW_DATA = "ENABLE_HTML_XBLOCK_STUDENT_VIEW_DATA"

    @XBlock.supports("multi_device")
    def student_view(self, _context):
        """
        Return a fragment that contains the html for the student view
        """
        frag = Fragment(self.get_html())
        frag.add_css(resource_loader.load_unicode("static/css/html.css"))
        frag.add_javascript("""function HtmlBlock(runtime, element){}""")
        frag.initialize_js("HtmlBlock")
        return frag

    @XBlock.supports("multi_device")
    def public_view(self, context):
        """
        Returns a fragment that contains the html for the preview view
        """
        return self.student_view(context)

    def student_view_data(self, context=None):  # pylint: disable=unused-argument
        """
        Return a JSON representation of the student_view of this XBlock.
        """
        if getattr(settings, "FEATURES", {}).get(self.ENABLE_HTML_XBLOCK_STUDENT_VIEW_DATA, False):
            return {"enabled": True, "html": self.get_html()}
        else:
            return {
                "enabled": False,
                "message": f'To enable, set FEATURES["{self.ENABLE_HTML_XBLOCK_STUDENT_VIEW_DATA}"]',
            }

    def get_html(self):
        """Returns html required for rendering the block."""
        if self.data:
            data = self.data
            user_id = (
                self.runtime.service(self, "user")
                .get_current_user()
                .opt_attrs.get(ATTR_KEY_DEPRECATED_ANONYMOUS_USER_ID)
            )
            if user_id:
                data = data.replace("%%USER_ID%%", user_id)
            data = data.replace("%%COURSE_ID%%", str(self.scope_ids.usage_id.context_key))
            return data
        return self.data

    uses_xmodule_styles_setup = True

    filename_extension = "xml"
    template_dir_name = "html"
    show_in_read_only_mode = True

    # VS[compat] TODO (cpennington): Delete this method once all fall 2012 course
    # are being edited in the cms
    @classmethod
    def backcompat_paths(cls, filepath):
        """
        Get paths for html and xml files.
        """
        if filepath.endswith(".html.xml"):
            filepath = filepath[:-9] + ".html"  # backcompat--look for html instead of xml
        if filepath.endswith(".html.html"):
            filepath = filepath[:-5]  # some people like to include .html in filenames..
        candidates = []
        while os.sep in filepath:
            candidates.append(filepath)
            _, _, filepath = filepath.partition(os.sep)

        # also look for .html versions instead of .xml
        new_candidates = []
        for candidate in candidates:
            if candidate.endswith(".xml"):
                new_candidates.append(candidate[:-4] + ".html")
        return candidates + new_candidates

    @classmethod
    def filter_templates(cls, template, course):
        """
        Filter template that contains 'latex' from templates.

        Show them only if use_latex_compiler is set to True in
        course settings.
        """
        return "latex" not in template["template_id"] or course.use_latex_compiler

    def get_context(self):
        """
        an override to add in specific rendering context, in this case we need to
        add in a base path to our c4x content addressing scheme
        """
        _context = {}
        # Add some specific HTML rendering context when editing HTML blocks where we pass
        # the root /c4x/ url for assets. This allows client-side substitutions to occur.
        _context.update(
            {
                "module": self,
                "editable_metadata_fields": self.editable_metadata_fields,  # pylint: disable=no-member
                "data": self.data,
                "base_asset_url": self.get_base_url_path_for_course_assets(
                    self.location.course_key
                ),
                "enable_latex_compiler": self.use_latex_compiler,
                "editor": self.editor,
            }
        )
        return _context

    # NOTE: html descriptors are special.  We do not want to parse and
    # export them ourselves, because that can break things (e.g. lxml
    # adds body tags when it exports, but they should just be html
    # snippets that will be included in the middle of pages.

    @classmethod
    def load_definition(cls, xml_object, system, location, id_generator):  # pylint: disable=unused-argument
        """Load a descriptor from the specified xml_object:

        If there is a filename attribute, load it as a string, and
        log a warning if it is not parseable by etree.HTMLParser.

        If there is not a filename attribute, the definition is the body
        of the xml_object, without the root tag (do not want <html> in the
        middle of a page)

        Args:
            xml_object: an lxml.etree._Element containing the definition to load
            system: the modulestore system or runtime which caches data
            location: the usage id for the block--used to compute the filename if none in the xml_object
            id_generator: used by other impls of this method to generate the usage_id
        """
        filename = xml_object.get("filename")
        if filename is None:
            definition_xml = copy.deepcopy(xml_object)
            cls.clean_metadata_from_xml(definition_xml)
            return {"data": stringify_children(definition_xml)}, []
        else:
            # html is special.  cls.filename_extension is 'xml', but
            # if 'filename' is in the definition, that means to load
            # from .html
            # 'filename' in html pointers is a relative path
            # (not same as 'html/blah.html' when the pointer is in a directory itself)
            pointer_path = "{category}/{url_path}".format(category="html", url_path=name_to_pathname(location.block_id))
            base = path(pointer_path).dirname()
            # log.debug("base = {0}, base.dirname={1}, filename={2}".format(base, base.dirname(), filename))
            filepath = f"{base}/{filename}.html"
            # log.debug("looking for html file for {0} at {1}".format(location, filepath))

            # VS[compat]
            # TODO (cpennington): If the file doesn't exist at the right path,
            # give the class a chance to fix it up. The file will be written out
            # again in the correct format.  This should go away once the CMS is
            # online and has imported all current (fall 2012) courses from xml
            if not system.resources_fs.exists(filepath):

                candidates = cls.backcompat_paths(filepath)
                # log.debug("candidates = {0}".format(candidates))
                for candidate in candidates:
                    if system.resources_fs.exists(candidate):
                        filepath = candidate
                        break

            try:
                with system.resources_fs.open(filepath, encoding="utf-8") as infile:
                    html = infile.read()
                    # Log a warning if we can't parse the file, but don't error
                    if not check_html(html) and len(html) > 0:
                        msg = f"Couldn't parse html in {filepath}, content = {html}"
                        log.warning(msg)
                        system.error_tracker("Warning: " + msg)

                    definition = {"data": html}

                    # TODO (ichuang): remove this after migration
                    # for Fall 2012 LMS migration: keep filename (and unmangled filename)
                    definition["filename"] = [filepath, filename]

                    return definition, []

            except ResourceNotFound as err:
                msg = "Unable to load file contents at path {}: {} ".format(filepath, err)
                # add more info and re-raise
                raise Exception(msg).with_traceback(sys.exc_info()[2])

    @classmethod
    def parse_xml_new_runtime(cls, node, runtime, keys):
        """
        Parse XML in the new learning-core-based runtime. Since it doesn't yet
        support loading separate .html files, the HTML data is assumed to be in
        a CDATA child or otherwise just inline in the OLX.
        """
        block = runtime.construct_xblock_from_class(cls, keys)
        block.data = stringify_children(node)
        # Attributes become fields.
        for name, value in node.items():
            cls._set_field_if_present(block, name, value, {})
        return block

    # TODO (vshnayder): make export put things in the right places.

    def definition_to_xml(self, resource_fs):
        """Write <html filename="" [meta-attrs="..."]> to filename.xml, and the html
        string to filename.html.
        """

        # Write html to file, return an empty tag
        pathname = name_to_pathname(self.url_name)
        filepath = "{category}/{pathname}.html".format(category=self.category, pathname=pathname)

        resource_fs.makedirs(os.path.dirname(filepath), recreate=True)
        with resource_fs.open(filepath, "wb") as filestream:
            html_data = self.data.encode("utf-8")
            filestream.write(html_data)

        # write out the relative name
        relname = path(pathname).basename()

        elt = etree.Element("html")
        elt.set("filename", relname)
        return elt

    @property
    def non_editable_metadata_fields(self):
        """
        `use_latex_compiler` should not be editable in the Studio settings editor.
        """
        non_editable_fields = super().non_editable_metadata_fields  # pylint: disable=no-member
        non_editable_fields.append(self.use_latex_compiler)
        return non_editable_fields

    def index_dictionary(self):
        xblock_body = super().index_dictionary()
        # Removing script and style
        html_content = re.sub(
            re.compile(
                r"""
                    <script>.*?</script> |
                    <style>.*?</style>
                """,
                re.DOTALL | re.VERBOSE,
            ),
            "",
            self.data,
        )
        html_content = escape_html_characters(html_content)
        html_body = {
            "html_content": html_content,
            "display_name": self.display_name,
        }
        if "content" in xblock_body:
            xblock_body["content"].update(html_body)
        else:
            xblock_body["content"] = html_body
        xblock_body["content_type"] = "Text"
        return xblock_body

    @staticmethod
    def workbench_scenarios():
        """Create canned scenario for display in the workbench."""
        return [
            (
                "HtmlBlock",
                """<_html_extracted/>
                """,
            ),
            (
                "Multiple HtmlBlock",
                """<vertical_demo>
                <_html_extracted/>
                <_html_extracted/>
                <_html_extracted/>
                </vertical_demo>
                """,
            ),
        ]

    @staticmethod
    def get_base_url_path_for_course_assets(course_key):  # pylint: disable=missing-function-docstring
        if (course_key is None) or isinstance(course_key, LibraryLocatorV2):
            return None

        assert isinstance(course_key, CourseKey)
        placeholder_id = uuid.uuid4().hex
        # create a dummy asset location with a fake but unique name. strip off the name, and return it
        url_path = HtmlBlock.serialize_asset_key_with_slash(
            course_key.make_asset_key("asset", placeholder_id).for_branch(None)
        )
        return url_path.replace(placeholder_id, "")

    @staticmethod
    def serialize_asset_key_with_slash(asset_key):
        """
        Legacy code expects the serialized asset key to start w/ a slash; so, do that in one place
        :param asset_key:
        """
        url = str(asset_key)
        if not url.startswith("/"):
            url = "/" + url  # TODO - re-address this once LMS-11198 is tackled.
        return url

    def bind_for_student(self, user_id, wrappers=None):
        """
        Set up this XBlock to act as an XModule instead of an XModuleDescriptor.

        Arguments:
            user_id: The user_id to set in scope_ids
            wrappers: These are a list functions that put a wrapper, such as
                      LmsFieldData or OverrideFieldData, around the field_data.
                      Note that the functions will be applied in the order in
                      which they're listed. So [f1, f2] -> f2(f1(field_data))
        """

        # Skip rebinding if we're already bound a user, and it's this user.
        if self.scope_ids.user_id is not None and user_id == self.scope_ids.user_id:
            if getattr(self.runtime, "position", None):
                self.position = self.runtime.position  # pylint: disable=attribute-defined-outside-init
            return

        # If we are switching users mid-request, save the data from the old user.
        self.save()

        # Update scope_ids to point to the new user.
        self.scope_ids = self.scope_ids._replace(user_id=user_id)

        # Clear out any cached instantiated children.
        self.clear_child_cache()

        # Clear out any cached field data scoped to the old user.
        for field in self.fields.values():
            if field.scope in (Scope.parent, Scope.children):
                continue

            if field.scope.user == UserScope.ONE:
                field._del_cached_value(self)  # pylint: disable=protected-access
                # not the most elegant way of doing this, but if we're removing
                # a field from the module's field_data_cache, we should also
                # remove it from its _dirty_fields
                if field in self._dirty_fields:
                    del self._dirty_fields[field]

        if wrappers:
            # Put user-specific wrappers around the field-data service for this block.
            # Note that these are different from modulestore.xblock_field_data_wrappers, which are not user-specific.
            wrapped_field_data = self.runtime.service(self, "field-data-unbound")
            for wrapper in wrappers:
                wrapped_field_data = wrapper(wrapped_field_data)
            self._bound_field_data = wrapped_field_data  # pylint: disable=attribute-defined-outside-init
            if getattr(self.runtime, "uses_deprecated_field_data", False):
                # This approach is deprecated but old mongo's CachingDescriptorSystem still requires it.
                # For Split mongo's CachingDescriptor system, don't set ._field_data this way.
                self._field_data = wrapped_field_data

    @property
    def xblock_kvs(self):
        """
        Retrieves the internal KeyValueStore for this XModule.

        Should only be used by the persistence layer. Use with caution.
        """
        # if caller wants kvs, caller's assuming it's up to date; so, decache it
        self.save()
        return self._field_data._kvs  # pylint: disable=protected-access

    @property
    def category(self):
        return self.scope_ids.block_type

    children = List(
        help=_("Child blocks of this XBlock."),
        default=[],
        scope=Scope.content,
    )

    url_name = String(
        help=_("Unique URL-friendly identifier of the block."),
        scope=Scope.settings,
    )

    @property
    def _url_name(self):
        return self.location.block_id

    @property
    def location(self):
        return self.scope_ids.usage_id

    @location.setter
    def location(self, value):
        assert isinstance(value, UsageKey)
        self.scope_ids = self.scope_ids._replace(
            def_id=str(value),
            usage_id=value,
        )

    xml_attributes = Dict(
        help="Map of unhandled xml attributes, used only for storage between import and export",
        default={},
        scope=Scope.settings,
    )
