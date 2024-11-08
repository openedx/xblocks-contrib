"""
Discussion XBlock
"""

import logging
import urllib
from importlib.resources import files

from django.contrib.staticfiles.storage import staticfiles_storage
from django.urls import reverse, translation
from django.utils.translation import get_language_bidi
from web_fragments.fragment import Fragment
from xblock.completable import XBlockCompletionMode
from xblock.core import XBlock
from xblock.fields import UNIQUE_ID, Scope, String
from xblock.utils.resources import ResourceLoader
from xblock.utils.studio_editable import StudioEditableXBlockMixin

from lms.djangoapps.discussion.django_comment_client.permissions import has_permission
from openedx.core.djangoapps.discussions.models import DiscussionsConfiguration, Provider
from openedx.core.djangolib.markup import HTML, Text
from openedx.core.lib.xblock_utils import get_css_dependencies, get_js_dependencies
from xmodule.xml_block import XmlMixin


resource_loader = ResourceLoader(__name__)


# This Xblock is just to test the strucutre of xblocks-contrib
@XBlock.needs("i18n")
class DiscussionXBlock(XBlock):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    # TO-DO: delete count, and define your own fields.
    count = Integer(
        default=0,
        scope=Scope.user_state,
        help="A simple counter, to show something happening",
    )

    # Indicates that this XBlock has been extracted from edx-platform.
    is_extracted = True

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        return files(__package__).joinpath(path).read_text(encoding="utf-8")

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        Create primary view of the DiscussionXBlock, shown to students when viewing courses.
        """
        if context:
            pass  # TO-DO: do something based on the context.

        frag = Fragment()
        frag.add_content(
            resource_loader.render_django_template(
                "templates/discussion.html",
                {
                    "count": self.count,
                },
                i18n_service=self.runtime.service(self, "i18n"),
            )
        )

        frag.add_css(self.resource_string("static/css/discussion.css"))
        frag.add_javascript(self.resource_string("static/js/src/discussion.js"))
        frag.initialize_js("DiscussionXBlock")
        return frag

    # TO-DO: change this handler to perform your own actions.  You may need more
    # than one handler, or you may not need any handlers at all.
    @XBlock.json_handler
    def increment_count(self, data, suffix=""):
        """
        Increments data. An example handler.
        """
        if suffix:
            pass  # TO-DO: Use the suffix when storing data.
        # Just to show data coming in...
        assert data["hello"] == "world"

        self.count += 1
        return {"count": self.count}

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """Create canned scenario for display in the workbench."""
        return [
            (
                "DiscussionXBlock",
                """<_discussion_extracted/>
                """,
            ),
            (
                "Multiple DiscussionXBlock",
                """<vertical_demo>
                <_discussion_extracted/>
                <_discussion_extracted/>
                <_discussion_extracted/>
                </vertical_demo>
                """,
            ),
        ]

    @staticmethod
    def get_dummy():
        """
        Generate initial i18n with dummy method.
        """
        return translation.gettext_noop("Dummy")
