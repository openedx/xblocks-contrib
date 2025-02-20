"""Poll block is ungraded xmodule used by students to
to do set of polls.

On the client side we show:
If student does not yet anwered - Question with set of choices.
If student have answered - Question with statistics for each answers.
"""
import html
import json
from collections import OrderedDict
from copy import deepcopy

import markupsafe
from django.utils.translation import gettext_noop as _
from lxml import etree
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Boolean, Dict, List, Scope, String
from xblock.utils.resources import ResourceLoader

from xblocks_contrib.utils.stringify import stringify_children

resource_loader = ResourceLoader(__name__)


# This Xblock is just to test the strucutre of xblocks-contrib
@XBlock.needs("i18n")
class PollBlock(XBlock):
    """Poll Block"""

    # Indicates that this XBlock has been extracted from edx-platform.
    is_extracted = True

    # Name of poll to use in links to this poll
    display_name = String(
        help=_("The display name for this component."),
        scope=Scope.settings
    )

    voted = Boolean(
        help=_("Whether this student has voted on the poll"),
        scope=Scope.user_state,
        default=False
    )
    poll_answer = String(
        help=_("Student answer"),
        scope=Scope.user_state,
        default=''
    )
    poll_answers = Dict(
        help=_("Poll answers from all students"),
        scope=Scope.user_state_summary
    )

    # List of answers, in the form {'id': 'some id', 'text': 'the answer text'}
    answers = List(
        help=_("Poll answers from xml"),
        scope=Scope.content,
        default=[]
    )

    question = String(
        help=_("Poll question"),
        scope=Scope.content,
        default=''
    )

    resources_dir = None
    uses_xmodule_styles_setup = True

    def student_view(self, _context):
        """
        Renders the student view.
        """
        # import pdb; pdb.set_trace()
        frag = Fragment()
        frag.add_content(resource_loader.render_django_template(
            "templates/poll.html", {
                'element_id': self.scope_ids.usage_id.html_id(),
                'element_class': self.scope_ids.usage_id.block_type,
                'configuration_json': self.dump_poll(),
            },
            i18n_service=self.runtime.service(self, 'i18n')
        ))
        frag.add_css(resource_loader.load_unicode("static/css/poll.css"))
        frag.add_javascript(resource_loader.load_unicode("static/js/src/poll.js"))
        frag.initialize_js('PollBlock')
        return frag

    def dump_poll(self):
        """Dump poll information.

        Returns:
            string - Serialize json.
        """
        # FIXME: hack for resolving caching `default={}` during definition
        # poll_answers field
        if self.poll_answers is None:
            self.poll_answers = {}

        answers_to_json = OrderedDict()

        # FIXME: fix this, when xblock support mutable types.
        # Now we use this hack.
        temp_poll_answers = self.poll_answers

        # Fill self.poll_answers, prepare data for template context.
        for answer in self.answers:
            # Set default count for answer = 0.
            if answer['id'] not in temp_poll_answers:
                temp_poll_answers[answer['id']] = 0
            answers_to_json[answer['id']] = html.escape(answer['text'], quote=False)
        self.poll_answers = temp_poll_answers

        return json.dumps({
            'answers': answers_to_json,
            'question': html.escape(self.question, quote=False),
            # to show answered poll after reload:
            'poll_answer': self.poll_answer,
            'poll_answers': self.poll_answers if self.voted else {},
            'total': sum(self.poll_answers.values()) if self.voted else 0,
            # TODO: Uncomment it
            # 'reset': str(self.xml_attributes.get('reset', 'true')).lower()
        })

    _tag_name = 'poll_question'
    _child_tag_name = 'answer'
    #
    # @classmethod
    # def definition_from_xml(cls, xml_object, system):
    #     """Pull out the data into dictionary.
    #
    #     Args:
    #         xml_object: xml from file.
    #         system: `system` object.
    #
    #     Returns:
    #         (definition, children) - tuple
    #         definition - dict:
    #             {
    #                 'answers': <List of answers>,
    #                 'question': <Question string>
    #             }
    #     """
    #     # Check for presense of required tags in xml.
    #     if len(xml_object.xpath(cls._child_tag_name)) == 0:
    #         raise ValueError("Poll_question definition must include \
    #             at least one 'answer' tag")
    #
    #     xml_object_copy = deepcopy(xml_object)
    #     answers = []
    #     for element_answer in xml_object_copy.findall(cls._child_tag_name):
    #         answer_id = element_answer.get('id', None)
    #         if answer_id:
    #             answers.append({
    #                 'id': answer_id,
    #                 'text': stringify_children(element_answer)
    #             })
    #         xml_object_copy.remove(element_answer)
    #
    #     definition = {
    #         'answers': answers,
    #         'question': stringify_children(xml_object_copy)
    #     }
    #     children = []
    #
    #     return (definition, children)
    #
    # def definition_to_xml(self, resource_fs):
    #     """Return an xml element representing to this definition."""
    #     poll_str = markupsafe.Markup('<{tag_name}>{text}</{tag_name}>').format(
    #         tag_name=self._tag_name, text=self.question)
    #     xml_object = etree.fromstring(poll_str)
    #     xml_object.set('display_name', self.display_name)
    #
    #     def add_child(xml_obj, answer):  # lint-amnesty, pylint: disable=unused-argument
    #         # Escape answer text before adding to xml tree.
    #         answer_text = str(answer['text'])
    #         child_str = markupsafe.escape('{tag_begin}{text}{tag_end}').format(
    #             tag_begin=markupsafe.Markup('<{tag_name} id="{id}">').format(
    #                 tag_name=self._child_tag_name,
    #                 id=answer['id']
    #             ),
    #             text=answer_text,
    #             tag_end=markupsafe.Markup('</{tag_name}>').format(tag_name=self._child_tag_name)
    #         )
    #         child_node = etree.fromstring(child_str)
    #         xml_object.append(child_node)
    #
    #     for answer in self.answers:
    #         add_child(xml_object, answer)
    #
    #     return xml_object

    @staticmethod
    def workbench_scenarios():
        """Create canned scenario for display in the workbench."""
        return [
            (
                "PollBlock",
                """<_poll_question_extracted/>
                """,
            ),
            (
                "Multiple PollBlock",
                """<vertical_demo>
                <_poll_question_extracted/>
                <_poll_question_extracted/>
                <_poll_question_extracted/>
                </vertical_demo>
                """,
            ),
        ]

    @XBlock.json_handler
    def handle_reset_state(self):
        pass

    def handle_ajax(self, dispatch, data):  # lint-amnesty, pylint: disable=unused-argument
        """Ajax handler.

        Args:
            dispatch: string request slug
            data: dict request data parameters

        Returns:
            json string
        """
        if dispatch in self.poll_answers and not self.voted:
            # FIXME: fix this, when xblock will support mutable types.
            # Now we use this hack.
            temp_poll_answers = self.poll_answers
            temp_poll_answers[dispatch] += 1
            self.poll_answers = temp_poll_answers

            self.voted = True
            self.poll_answer = dispatch
            return json.dumps({'poll_answers': self.poll_answers,
                               'total': sum(self.poll_answers.values()),
                               'callback': {'objectName': 'Conditional'}
                               })
        elif dispatch == 'get_state':
            return json.dumps({'poll_answer': self.poll_answer,
                               'poll_answers': self.poll_answers,
                               'total': sum(self.poll_answers.values())
                               })
        elif dispatch == 'reset_poll' and self.voted and \
            self.xml_attributes.get('reset', 'True').lower() != 'false':
            self.voted = False

            # FIXME: fix this, when xblock will support mutable types.
            # Now we use this hack.
            temp_poll_answers = self.poll_answers
            temp_poll_answers[self.poll_answer] -= 1
            self.poll_answers = temp_poll_answers

            self.poll_answer = ''
            return json.dumps({'status': 'success'})
        else:  # return error message
            return json.dumps({'error': 'Unknown Command!'})
