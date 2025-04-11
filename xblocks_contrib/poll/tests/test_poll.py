"""
Tests for PollBlock
"""

import json

from django.test import TestCase
from opaque_keys.edx.keys import CourseKey
from xblock.field_data import DictFieldData
from xblock.fields import ScopeIds
from xblock.test.tools import TestRuntime, DummySystem
from lxml import etree

from xblocks_contrib.poll.poll import PollBlock


class PollBlockTest(TestCase):
    """Logic tests for PollBlock"""

    raw_field_data = {
        'poll_answers': {'Yes': 1, 'Dont_know': 0, 'No': 0},
        'voted': False,
        'poll_answer': ''
    }

    def setUp(self):
        super().setUp()
        course_key = CourseKey.from_string('org/course/run')
        self.system = TestRuntime()
        usage_key = course_key.make_usage_key("block_type", "test_loc")
        self.scope_ids = ScopeIds(1, "block_type", usage_key, usage_key)
        self.xblock = PollBlock(self.system, DictFieldData(self.raw_field_data), self.scope_ids)

    def test_poll_export_with_unescaped_characters_xml(self):
        """
        Ensure that PollBlock exports unescaped characters correctly in its XML.
        """
        # Create a dummy system and set its target course id.
        module_system = DummySystem(load_error_blocks=True)
        module_system.id_generator.target_course_id = self.xblock.course_id

        # Define a sample poll XML.
        sample_poll_xml = '''
        <poll_question display_name="Poll Question">
            <p>How old are you?</p>
            <answer id="less18">18</answer>
        </poll_question>
        '''
        node = etree.fromstring(sample_poll_xml)

        # Parse the XML to create a PollBlock instance.
        poll_instance = PollBlock.parse_xml(node, module_system, self.scope_ids)

        # Update the answer text with an unescaped character.
        poll_instance.answers[0]['text'] = '< 18'

        # Save changes.
        poll_instance.save()

        # Export the PollBlock definition back to XML.
        exported_xml = poll_instance.definition_to_xml(None)
        # Extract all text nodes.
        texts = exported_xml.xpath('//text()')
        # Assert that the last text node contains the unescaped answer.
        self.assertEqual(texts[-1], '< 18')
