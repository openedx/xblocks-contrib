"""TO-DO: Write a description of what this XBlock is."""

from importlib_resources import files
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Integer, Scope


class PollXBlock(XBlock):
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

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        return files(__name__).joinpath(path).read_text()

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        Create primary view of the PollXBlock, shown to students when viewing courses.
        """
        if context:
            pass  # TO-DO: do something based on the context.
        html = self.resource_string("static/html/poll.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("static/css/poll.css"))
        frag.add_javascript(self.resource_string("static/js/src/poll.js"))
        frag.initialize_js("PollXBlock")
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
                "PollXBlock",
                """<poll_xblock/>
             """,
            ),
            (
                "Multiple PollXBlock",
                """<vertical_demo>
                <poll_xblock/>
                <poll_xblock/>
                <poll_xblock/>
                </vertical_demo>
             """,
            ),
        ]