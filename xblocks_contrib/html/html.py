import copy
import logging
import os
import re
import sys

from django.conf import settings
from fs.errors import ResourceNotFound
from lxml import etree
from path import Path as path
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Boolean, Scope, String

from .utils import check_html, escape_html_characters, name_to_pathname, stringify_children

log = logging.getLogger("edx.courseware")

# Make '_' a no-op so we can scrape strings. Using lambda instead of
#  `django.utils.translation.ugettext_noop` because Django cannot be imported in this file
_ = lambda text: text


@XBlock.needs("i18n")
@XBlock.needs("mako")
@XBlock.needs("user")
@edxnotes
class HtmlBlockMixin(XBlock):
    """
    The HTML XBlock mixin.
    This provides the base class for all Html-ish blocks (including the HTML XBlock).
    """

    display_name = String(
        display_name=_("Display Name"),
        help=_("The display name for this component."),
        scope=Scope.settings,
        # it'd be nice to have a useful default but it screws up other things; so,
        # use display_name_with_default for those
        default=_("Text"),
    )
    data = String(
        help=_("Html contents to display for this block"), default="", scope=Scope.content
    )
    source_code = String(
        help=_("Source code for LaTeX documents. This feature is not well-supported."),
        scope=Scope.settings,
    )
    use_latex_compiler = Boolean(
        help=_("Enable LaTeX templates?"), default=False, scope=Scope.settings
    )
    editor = String(
        help=_(
            "Select Visual to enter content and have the editor automatically create the HTML. Select Raw to edit "
            "HTML directly. If you change this setting, you must save the component and then re-open it for editing."
        ),
        display_name=_("Editor"),
        default="visual",
        values=[
            {"display_name": _("Visual"), "value": "visual"},
            {"display_name": _("Raw"), "value": "raw"},
        ],
        scope=Scope.settings,
    )

    ENABLE_HTML_XBLOCK_STUDENT_VIEW_DATA = "ENABLE_HTML_XBLOCK_STUDENT_VIEW_DATA"
    is_extracted = False

    @XBlock.supports("multi_device")
    def student_view(self, _context):
        """
        Return a fragment that contains the html for the student view
        """
        fragment = Fragment(self.get_html())
        add_css_to_fragment(fragment, "HtmlBlockDisplay.css")
        add_webpack_js_to_fragment(fragment, "HtmlBlockDisplay")
        shim_xmodule_js(fragment, "HTMLModule")
        return fragment

    @XBlock.supports("multi_device")
    def public_view(self, context):
        """
        Returns a fragment that contains the html for the preview view
        """
        return self.student_view(context)

    def student_view_data(self, context=None):
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

    def studio_view(self, _context):
        """
        Return the studio view.
        """
        fragment = Fragment(
            self.runtime.service(self, "mako").render_cms_template(
                self.mako_template, self.get_context()
            )
        )
        add_css_to_fragment(fragment, "HtmlBlockEditor.css")
        add_webpack_js_to_fragment(fragment, "HtmlBlockEditor")
        shim_xmodule_js(fragment, "HTMLEditingDescriptor")
        return fragment

    uses_xmodule_styles_setup = True

    mako_template = "widgets/html-edit.html"
    resources_dir = None
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
        _context = EditingMixin.get_context(self)
        # Add some specific HTML rendering context when editing HTML blocks where we pass
        # the root /c4x/ url for assets. This allows client-side substitutions to occur.
        _context.update(
            {
                "base_asset_url": StaticContent.get_base_url_path_for_course_assets(
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
    def load_definition(cls, xml_object, system, location, id_generator):
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
            pointer_path = "{category}/{url_path}".format(
                category="html", url_path=name_to_pathname(location.block_id)
            )
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
        non_editable_fields = super().non_editable_metadata_fields
        non_editable_fields.append(HtmlBlockMixin.use_latex_compiler)
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
