"""TO-DO: Write a description of what this XBlock is."""

import textwrap
from importlib.resources import files

import markupsafe
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Scope, String
from xblock.utils.resources import ResourceLoader

resource_loader = ResourceLoader(__name__)


def _(text):
    """Make '_' a no-op, so we can scrape strings"""
    return text


class AnnotatableXBlock(XBlock):
    """
    Annotatable XBlock.
    """

    display_name = String(
        display_name=_("Display Name"),
        help=_("The display name for this component."),
        scope=Scope.settings,
        default=_("Annotation"),
    )

    data = String(
        help=_("XML data for the annotation"),
        scope=Scope.content,
        default=textwrap.dedent(
            markupsafe.Markup(
                """
        <annotatable>
            <instructions>
                <p>Enter your (optional) instructions for the exercise in HTML format.</p>
                <p>Annotations are specified by an <code>{}annotation{}</code> tag which may may have the following attributes:</p>
                <ul class="instructions-template">
                    <li><code>title</code> (optional). Title of the annotation. Defaults to <i>Commentary</i> if omitted.</li>
                    <li><code>body</code> (<b>required</b>). Text of the annotation.</li>
                    <li><code>problem</code> (optional). Numeric index of the problem associated with this annotation. This is a zero-based index, so the first problem on the page would have <code>problem="0"</code>.</li>
                    <li><code>highlight</code> (optional). Possible values: yellow, red, orange, green, blue, or purple. Defaults to yellow if this attribute is omitted.</li>
                </ul>
            </instructions>
            <p>Add your HTML with annotation spans here.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. <annotation title="My title" body="My comment" highlight="yellow" problem="0">Ut sodales laoreet est, egestas gravida felis egestas nec.</annotation> Aenean at volutpat erat. Cras commodo viverra nibh in aliquam.</p>
            <p>Nulla facilisi. <annotation body="Basic annotation example." problem="1">Pellentesque id vestibulum libero.</annotation> Suspendisse potenti. Morbi scelerisque nisi vitae felis dictum mattis. Nam sit amet magna elit. Nullam volutpat cursus est, sit amet sagittis odio vulputate et. Curabitur euismod, orci in vulputate imperdiet, augue lorem tempor purus, id aliquet augue turpis a est. Aenean a sagittis libero. Praesent fringilla pretium magna, non condimentum risus elementum nec. Pellentesque faucibus elementum pharetra. Pellentesque vitae metus eros.</p>
        </annotatable>
        """
            ).format(markupsafe.escape("<"), markupsafe.escape(">"))
        ),
    )

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        return files(__package__).joinpath(path).read_text()

    def student_view(self, context=None):
        """
        Create primary view of the AnnotatableXBlock, shown to students when viewing courses.
        """
        if context:
            pass  # TO-DO: do something based on the context.
        html = self.resource_string("static/html/annotatable.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("static/css/annotatable.css"))

        frag.add_javascript(self.resource_string("static/js/src/annotatable.js"))
        frag.initialize_js("AnnotatableXBlock")
        return frag

    def studio_view(self, _context=None):
        """
        Return the studio view.
        """
        frag = Fragment()
        frag.add_content(
            resource_loader.render_django_template(
                "templates/studioview.html",
                {},
                i18n_service=self.runtime.service(self, "i18n"),
            )
        )
        return frag

    @staticmethod
    def workbench_scenarios():
        """Create canned scenario for display in the workbench."""
        return [
            (
                "AnnotatableXBlock",
                """<annotatable_xblock/>
                """,
            ),
            (
                "Multiple AnnotatableXBlock",
                """<vertical_demo>
                <annotatable_xblock/>
                <annotatable_xblock/>
                <annotatable_xblock/>
                </vertical_demo>
                """,
            ),
        ]
