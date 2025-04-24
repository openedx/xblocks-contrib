"""
HTML XBlock module for displaying raw HTML content.
This XBlock allows users to embed HTML content inside courses.
"""

import logging
import os
import re
from importlib import resources

import yaml
from django.conf import settings
from django.utils.translation import gettext_noop as _
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Boolean, Dict, Scope, String
from xblock.utils.resources import ResourceLoader

from xblocks_contrib.utils import escape_html_characters

log = logging.getLogger(__name__)

resource_loader = ResourceLoader(__name__)

# The global (course-agnostic) anonymous user ID for the user.
ATTR_KEY_DEPRECATED_ANONYMOUS_USER_ID = "edx-platform.deprecated_anonymous_user_id"


class ResourceTemplates:
    """
    Gets the yaml templates associated with a containing cls for display in the Studio.

    The cls must have a 'template_dir_name' attribute. It finds the templates as directly
    in this directory under 'templates'.

    Additional templates can be loaded by setting the
    CUSTOM_RESOURCE_TEMPLATES_DIRECTORY configuration setting.

    Note that a template must end with ".yaml" extension otherwise it will not be
    loaded.
    """

    template_packages = [__name__]

    @classmethod
    def _load_template(cls, template_path, template_id):
        """
        Reads an loads the yaml content provided in the template_path and
        return the content as a dictionary.
        """
        if not os.path.exists(template_path):
            return None

        with open(template_path) as file_object:
            template = yaml.safe_load(file_object)
            template["template_id"] = template_id
            return template

    @classmethod
    def _load_templates_in_dir(cls, dirpath):
        """
        Lists every resource template found in the provided dirpath.
        """
        templates = []
        for template_file in os.listdir(dirpath):
            if not template_file.endswith(".yaml"):
                log.warning("Skipping unknown template file %s", template_file)
                continue

            template = cls._load_template(os.path.join(dirpath, template_file), template_file)
            templates.append(template)
        return templates

    @classmethod
    def templates(cls):
        """
        Returns a list of dictionary field: value objects that describe possible templates that can be used
        to seed a module of this type.

        Expects a class attribute template_dir_name that defines the directory
        inside the 'templates' resource directory to pull templates from.
        """
        templates = {}

        for dirpath in cls.get_template_dirpaths():
            for template in cls._load_templates_in_dir(dirpath):
                templates[template["template_id"]] = template

        return list(templates.values())

    @classmethod
    def get_template_dir(cls):  # pylint: disable=missing-function-docstring
        if getattr(cls, "template_dir_name", None):
            dirname = os.path.join("templates", cls.template_dir_name)
            template_path = resources.files(__name__.rsplit(".", 1)[0]) / dirname

            if not template_path.is_dir():
                log.warning(
                    "No resource directory %s found when loading %s templates",
                    dirname,
                    cls.__name__,
                )
                return None
            return dirname
        return None

    @classmethod
    def get_template_dirpaths(cls):
        """
        Returns of list of directories containing resource templates.
        """
        template_dirpaths = []
        template_dirname = cls.get_template_dir()
        if template_dirname:
            template_path = resources.files(__name__.rsplit(".", 1)[0]) / template_dirname
            if template_path.is_dir():
                with resources.as_file(template_path) as template_real_path:
                    template_dirpaths.append(str(template_real_path))

        custom_template_dir = cls.get_custom_template_dir()
        if custom_template_dir:
            template_dirpaths.append(custom_template_dir)
        return template_dirpaths

    @classmethod
    def get_custom_template_dir(cls):
        """
        If settings.CUSTOM_RESOURCE_TEMPLATES_DIRECTORY is defined, check if it has a
        subdirectory named as the class's template_dir_name and return the full path.
        """
        template_dir_name = getattr(cls, "template_dir_name", None)

        if template_dir_name is None:
            return None

        resource_dir = settings.CUSTOM_RESOURCE_TEMPLATES_DIRECTORY

        if not resource_dir:
            return None

        template_dir_path = os.path.join(resource_dir, template_dir_name)

        if os.path.exists(template_dir_path):
            return template_dir_path
        return None

    @classmethod
    def get_template(cls, template_id):
        """
        Get a single template by the given id (which is the file name identifying it w/in the class's
        template_dir_name)
        """
        for directory in sorted(cls.get_template_dirpaths(), reverse=True):
            abs_path = os.path.join(directory, template_id)
            if os.path.exists(abs_path):
                return cls._load_template(abs_path, template_id)
        return None


@XBlock.needs("i18n")
@XBlock.needs("user")
class HtmlBlock(ResourceTemplates, XBlock):
    """
    The HTML XBlock
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
        help=_("Html contents to display for this block"),
        default="",
        scope=Scope.content,
    )

    xml_attributes = Dict(
        help="Map of unhandled xml attributes, used only for storage between import and export",
        default={},
        scope=Scope.settings,
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

    # Indicates that this XBlock has been extracted from edx-platform.
    is_extracted = True

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
