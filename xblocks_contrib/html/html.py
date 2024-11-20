"""XBlock: HtmlBlock for rendering and managing HTML content with LaTeX support."""

import logging

from django.utils.translation import gettext_lazy as _
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Boolean, Scope, String
from xblock.utils.resources import ResourceLoader
from xblock.validation import ValidationMessage

log = logging.getLogger(__name__)
resource_loader = ResourceLoader(__name__)


@XBlock.needs("i18n")
@XBlock.needs("user")
class HtmlBlock(XBlock):
    """
    An XBlock to manage HTML content display and optional LaTeX compilation.
    """

    display_name = String(
        display_name=_("Display Name"),
        help=_("The display name for this HTML content block."),
        scope=Scope.settings,
        default=_("Raw HTML"),
    )
    data = String(
        help=_("HTML contents to display within the block."),
        default=_(
            "<p>This is a Raw HTML editor that saves your HTML exactly as you enter it."
            "This means that even malformed HTML tags will be saved and rendered as-is."
            "There is no way to switch between Raw and Visual Text editor types, so be"
            "sure this is the editor you should be using!</p>"
        ),
        scope=Scope.content,
    )
    use_latex_compiler = Boolean(
        help=_("Enable LaTeX templates for this block?"),
        default=False,
        scope=Scope.settings,
    )
    editor = String(
        help=_(
            "Choose 'Visual' for a WYSIWYG editor or 'Raw' for direct HTML editing. "
            "Changing this setting requires a save and refresh."
        ),
        display_name=_("Editor"),
        default="raw",
        values=[
            {"display_name": _("Visual"), "value": "visual"},
            {"display_name": _("Raw"), "value": "raw"}
        ],
        scope=Scope.settings,
    )

    def resource_string(self, path):
        """Utility to load static resources."""
        return resource_loader.load_unicode(path)

    def student_view(self, context=None):
        """
        Render the main HTML view for students.
        """
        fragment = Fragment()
        fragment.add_content(self.get_html())
        fragment.add_css(self.resource_string("static/css/html.css"))
        fragment.add_javascript(self.resource_string("static/js/src/html.js"))
        fragment.initialize_js('HtmlBlock')
        return fragment

    def get_html(self):
        """Generate and return the HTML for the student view."""
        content = self.data or ""
        if self.runtime.service(self, "user"):
            user_id = self.runtime.service(self, 'user').get_current_user().opt_attrs.get("deprecated_anon_id")
            content = content.replace("%%USER_ID%%", user_id or "Anonymous")
        content = content.replace("%%COURSE_ID%%", str(self.scope_ids.usage_id.context_key))
        return content

    def studio_view(self, context=None):
        """
        Render the view used in Studio for authoring this XBlock.
        """
        fragment = Fragment()
        context = self.get_studio_context()
        fragment.add_content(
            resource_loader.render_django_template("templates/html_editor.html", context)
        )
        fragment.add_css(self.resource_string("static/css/html_editor.css"))
        fragment.add_javascript(self.resource_string("static/js/src/html_editor.js"))
        fragment.initialize_js('HtmlBlockStudio')
        return fragment

    def get_studio_context(self):
        """Context for Studio view, adding settings and editor choice."""
        return {
            "display_name": self.display_name,
            "data": self.data,
            "editor": self.editor,
            "use_latex_compiler": self.use_latex_compiler,
        }

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

    def validate_field_data(self, validation):
        """Validate that required fields contain appropriate data."""
        if not self.data:
            validation.add(ValidationMessage(ValidationMessage.WARNING, _("No HTML content provided.")))
        return validation
