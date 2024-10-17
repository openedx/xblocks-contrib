"""TO-DO: Write a description of what this XBlock is."""

import uuid
import html
import json
from importlib.resources import files

from collections import OrderedDict
from django.utils import translation
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Boolean, Dict, List, Scope, String
from xblock.utils.resources import ResourceLoader

_ = lambda text: text
resource_loader = ResourceLoader(__name__)


@XBlock.needs("i18n")
class PollBlock(XBlock):
    
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

    # Indicates that this XBlock has been extracted from edx-platform.
    is_extracted = True

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        return files(__package__).joinpath(path).read_text(encoding="utf-8")

    def student_view(self, context=None):
        """
        Create primary view of the XBlock, shown to students when viewing courses.
        """
        fragment = Fragment()
        params = {
            'element_id': str(uuid.uuid1()),
            'element_class': '_poll_question_extracted',
            'configuration_json': self.dump_poll(),
        }
        fragment.add_content(
            resource_loader.render_django_template(
                "templates/poll.html",
                params
            )
        )

        fragment.add_css(resource_loader.load_unicode("static/css/poll.css"))
        fragment.add_javascript(resource_loader.load_unicode("static/js/src/poll.js"))
        fragment.initialize_js("PollBlock")
        return fragment
    
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
            # 'reset': str(self.xml_attributes.get('reset', 'true')).lower()
        })

    # TO-DO: change this handler to perform your own actions.  You may need more
    # than one handler, or you may not need any handlers at all.


    
    @XBlock.json_handler
    def handle_get_state(self):
        return {
            'poll_answer': self.poll_answer,
            'poll_answers': self.poll_answers,
            'total': sum(self.poll_answers.values())                               
        }
        
    @XBlock.json_handler
    def handle_submit_state(self, data):
        answer = data.get('answer')  # Extract the answer from the data payload
        if not answer:
            return {'error': 'No answer provided!'}
        
        if answer in self.poll_answers and not self.voted:
            # FIXME: fix this, when xblock will support mutable types.
            # Now we use this hack.
            temp_poll_answers = self.poll_answers
            temp_poll_answers[answer] += 1
            self.poll_answers = temp_poll_answers

            self.voted = True
            self.poll_answer = answer
            return {
                'poll_answers': self.poll_answers,
                'total': sum(self.poll_answers.values()),
                'callback': {'objectName': 'Conditional'}
            }

    @XBlock.json_handler
    def handle_reset_state(self):
        self.voted = False

        # FIXME: fix this, when xblock will support mutable types.
        # Now we use this hack.
        temp_poll_answers = self.poll_answers
        temp_poll_answers[self.poll_answer] -= 1
        self.poll_answers = temp_poll_answers

        self.poll_answer = ''
        return {'status': 'success'}


    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
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

    @staticmethod
    def get_dummy():
        """
        Generate initial i18n with dummy method.
        """
        return translation.gettext_noop("Dummy")
