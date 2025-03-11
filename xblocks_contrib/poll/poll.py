"""TO-DO: Write a description of what this XBlock is."""

import uuid
import html
import json

from importlib.resources import files
from copy import deepcopy
from collections import OrderedDict
from django.utils import translation
from lxml import etree
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Boolean, Dict, List, Scope, String
from xblock.utils.resources import ResourceLoader
# from xblocks_contrib.poll.xml_block import XmlMixin
# from xblocks_contrib.poll.x_module import XModuleMixin
from xmodule.x_module import XModuleMixin
from xmodule.xml_block import XmlMixin
from openedx.core.djangolib.markup import Text, HTML


_ = lambda text: text
resource_loader = ResourceLoader(__name__)


@XBlock.needs("i18n")
class PollBlock(XmlMixin, XModuleMixin):
    
    display_name = String(
        help=_("The display name for this component."),
        scope=Scope.settings,
        default='poll_extracted'
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
        # import pdb; pdb.set_trace();
        if self.poll_answers is None:
            self.poll_answers = {}

        answers_to_json = OrderedDict()

        # # # FIXME: fix this, when xblock support mutable types.
        # # # Now we use this hack.
        temp_poll_answers = self.poll_answers

        # # # Fill self.poll_answers, prepare data for template context.
        for answer in self.answers:
            # Set default count for answer = 0.
            if answer['id'] not in temp_poll_answers:
                temp_poll_answers[answer['id']] = 0
            answers_to_json[answer['id']] = html.escape(answer['text'], quote=False)
        self.poll_answers = temp_poll_answers
        # return json.dumps({
        #                     "answers": {
        #                         "yes": "Yes",
        #                         "no": "No"
        #                     },
        #                     "question": "<p>Text of the prompt</p>",
        #                     "poll_answer": "yes",
        #                     "poll_answers": {
        #                         "yes": 10,
        #                         "no": 10
        #                     },
        #                     "total": 20,
        #                     "reset": "true"
        # })
        # import pdb; pdb.set_trace();
        return json.dumps({
            'answers': answers_to_json,                
            'question': self.question, 
            # html.escape(self.question, quote=False),
            # to show answered poll after reload:
            'poll_answer': self.poll_answer,
            'poll_answers': self.poll_answers,
            'total': sum(self.poll_answers.values()) if self.voted else 0,
            # 'reset': str(self.xml_attributes.get('reset', 'true')).lower()
            
        })

    # TO-DO: change this handler to perform your own actions.  You may need more
    # than one handler, or you may not need any handlers at all.


    
    @XBlock.json_handler
    def handle_get_state(self, data, suffix=''):        
        return {
            'poll_answer': self.poll_answer,
            'poll_answers': self.poll_answers,
            'total': sum(self.poll_answers.values())                               
        }
        
    @XBlock.json_handler
    def handle_submit_state(self, data, suffix=''):
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


    def stringify_children(node):
        '''
        Return all contents of an xml tree, without the outside tags.
        e.g. if node is parse of
            "<html a="b" foo="bar">Hi <div>there <span>Bruce</span><b>!</b></div><html>"
        should return
            "Hi <div>there <span>Bruce</span><b>!</b></div>"

        fixed from
        http://stackoverflow.com/questions/4624062/get-all-text-inside-a-tag-in-lxml
        '''
        # Useful things to know:

        # node.tostring() -- generates xml for the node, including start
        #                 and end tags.  We'll use this for the children.
        # node.text -- the text after the end of a start tag to the start
        #                 of the first child
        # node.tail -- the text after the end this tag to the start of the
        #                 next element.
        parts = [node.text]
        for c in node.getchildren():
            parts.append(etree.tostring(c, with_tail=True, encoding='unicode'))

        # filter removes possible Nones in texts and tails
        return ''.join([part for part in parts if part])


    _tag_name = 'poll_question'
    _child_tag_name = 'answer'

    @classmethod
    def definition_from_xml(cls, xml_object, system):        
        """Pull out the data into dictionary.

        Args:
            xml_object: xml from file.
            system: `system` object.

        Returns:
            (definition, children) - tuple
            definition - dict:
                {
                    'answers': <List of answers>,
                    'question': <Question string>
                }
        """
        # Check for presense of required tags in xml.
        
        if len(xml_object.xpath(cls._child_tag_name)) == 0:
            raise ValueError("Poll_question definition must include \
                at least one 'answer' tag")

        xml_object_copy = deepcopy(xml_object)
        answers = []
        for element_answer in xml_object_copy.findall(cls._child_tag_name):
            answer_id = element_answer.get('id', None)
            if answer_id:
                answers.append({
                    'id': answer_id,
                    'text': cls.stringify_children(element_answer)
                })
            xml_object_copy.remove(element_answer)
        import pdb; pdb.set_trace();
        definition = {
            'answers': answers,
            'question': cls.stringify_children(xml_object_copy)
        }
        children = []

        return (definition, children)
    

    def definition_to_xml(self, resource_fs):
        """Return an xml element representing to this definition."""
        poll_str = HTML('<{tag_name}>{text}</{tag_name}>').format(
            tag_name=self._tag_name, text=self.question)
        xml_object = etree.fromstring(poll_str)
        xml_object.set('display_name', self.display_name)

        def add_child(xml_obj, answer):  # lint-amnesty, pylint: disable=unused-argument
            # Escape answer text before adding to xml tree.
            answer_text = str(answer['text'])
            child_str = Text('{tag_begin}{text}{tag_end}').format(
                tag_begin=HTML('<{tag_name} id="{id}">').format(
                    tag_name=self._child_tag_name,
                    id=answer['id']
                ),
                text=answer_text,
                tag_end=HTML('</{tag_name}>').format(tag_name=self._child_tag_name)
            )
            child_node = etree.fromstring(child_str)
            xml_object.append(child_node)

        for answer in self.answers:
            add_child(xml_object, answer)

        return xml_object
