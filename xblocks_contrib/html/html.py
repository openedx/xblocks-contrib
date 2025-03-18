"""
HTML XBlock module for displaying raw HTML content.
This XBlock allows users to embed HTML content inside courses.
"""

import re

from django.conf import settings
from django.utils.translation import gettext_noop as _
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Scope, String
from xblock.utils.resources import ResourceLoader

from xblocks_contrib.html.utils import escape_html_characters

resource_loader = ResourceLoader(__name__)

# The global (course-agnostic) anonymous user ID for the user.
ATTR_KEY_DEPRECATED_ANONYMOUS_USER_ID = "edx-platform.deprecated_anonymous_user_id"


@XBlock.needs("i18n")
@XBlock.needs("user")
class HtmlBlock(XBlock):
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

    def studio_view(self, context):  # pylint: disable=unused-argument
        """
        Generates a fragment that redirects to the new Studio editor URL.
        """
        course_key = self.runtime.course_id
        block_id = str(self.scope_ids.usage_id)

        new_url = f"http://apps.local.openedx.io:2001/authoring/course/{course_key}/editor/html/{block_id}"

        fragment = Fragment()
        fragment.add_content(
            f"""
            <script>
                window.location.href = "{new_url}";
            </script>
        """
        )
        return fragment

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
