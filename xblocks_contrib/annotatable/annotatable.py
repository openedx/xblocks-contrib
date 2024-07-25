import textwrap
from importlib.resources import files

import markupsafe
from lxml import etree
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Scope, String
from xblock.utils.resources import ResourceLoader
from xblock.utils.studio_editable import StudioEditableXBlockMixin

resource_loader = ResourceLoader(__name__)


def _(text):
    """Make '_' a no-op, so we can scrape strings"""
    return text


class AnnotatableXBlock(StudioEditableXBlockMixin, XBlock):
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

    instructions_html = String(
        help=_("Instructions HTML"),
        scope=Scope.user_state,
        default="",
        enforce_type=True
    )

    content_html = String(
        help=_("Content HTML"),
        scope=Scope.user_state,
        default="",
        enforce_type=True
    )

    editable_fields = ["display_name"]
    HIGHLIGHT_COLORS = ["yellow", "orange", "purple", "blue", "green"]

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        return files(__package__).joinpath(path).read_text()

    def _get_annotation_class_attr(self, index, el):
        """Returns a dict with the CSS class attribute to set on the annotation
        and an XML key to delete from the element.
        """

        attr = {}
        cls = ["annotatable-span", "highlight"]
        highlight_key = "highlight"
        color = el.get(highlight_key)

        if color is not None:
            if color in self.HIGHLIGHT_COLORS:
                cls.append("highlight-" + color)
            attr["_delete"] = highlight_key
        attr["value"] = " ".join(cls)

        return {"class": attr}

    def _get_annotation_data_attr(self, index, el):
        """Returns a dict in which the keys are the HTML data attributes
        to set on the annotation element. Each data attribute has a
        corresponding 'value' and (optional) '_delete' key to specify
        an XML attribute to delete.
        """

        data_attrs = {}
        attrs_map = {
            "body": "data-comment-body",
            "title": "data-comment-title",
            "problem": "data-problem-id",
        }

        for xml_key, html_key in attrs_map.items():
            if xml_key in el.attrib:
                value = el.get(xml_key, "")
                data_attrs[html_key] = {"value": value, "_delete": xml_key}

        return data_attrs

    def _render_annotation(self, index, el):
        """Renders an annotation element for HTML output."""
        attr = {}
        attr.update(self._get_annotation_class_attr(index, el))
        attr.update(self._get_annotation_data_attr(index, el))

        el.tag = "span"

        for key, value_dict in attr.items():
            el.set(key, value_dict["value"])
            if "_delete" in value_dict and value_dict["_delete"] is not None:
                delete_key = value_dict["_delete"]
                del el.attrib[delete_key]

    def _render_content(self):
        """Renders annotatable content with annotation spans and returns HTML."""

        xmltree = etree.fromstring(self.data)
        content = etree.tostring(xmltree, encoding="unicode")

        xmltree = etree.fromstring(content)
        xmltree.tag = "div"
        if "display_name" in xmltree.attrib:
            del xmltree.attrib["display_name"]

        index = 0
        for el in xmltree.findall(".//annotation"):
            self._render_annotation(index, el)
            index += 1

        return etree.tostring(xmltree, encoding="unicode")

    def _extract_instructions(self, xmltree):
        """Removes <instructions> from the xmltree and returns them as a string, otherwise None."""
        instructions = xmltree.find("instructions")
        if instructions is not None:
            instructions.tag = "div"
            xmltree.remove(instructions)
            return etree.tostring(instructions, encoding="unicode")
        return None

    def student_view(self, context=None):
        """
        Create primary view of the AnnotatableXBlock, shown to students when viewing courses.
        """
        if context:
            pass  # TO-DO: do something based on the context.
        xmltree = etree.fromstring(self.data)
        self.instructions_html = self._extract_instructions(xmltree)
        self.content_html = self._render_content()

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
        html = self.resource_string("static/html/annotatable_editor.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("static/css/annotatable_editor.css"))

        frag.add_javascript(self.resource_string("static/js/src/annotatable_editor.js"))
        frag.initialize_js("XMLEditor")
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
