"""
Tests for PollBlock
"""

import json

from django.test import TestCase
from opaque_keys.edx.keys import CourseKey
from lxml import etree
from xblock.field_data import DictFieldData
from xblock.fields import ScopeIds
from xblock.test.tools import TestRuntime
from xblocks_contrib import PollBlock


class PollBlockTest(TestCase):
    """Logic tests for Poll Xmodule."""

    raw_field_data = {
        'poll_answers': {'Yes': 1, 'Dont_know': 0, 'No': 0},
        'voted': False,
        'poll_answer': ''
    }

    def setUp(self):
        super().setUp()
        course_key = CourseKey.from_string('org/course/run')
        self.system = TestRuntime()

        # ScopeIds: (user_id, block_type, def_id, usage_id)
        usage_key = course_key.make_usage_key("block_type", 'test_loc')
        self.scope_ids = ScopeIds(1, "block_type", usage_key, usage_key)
        self.xblock = PollBlock(
            self.system, DictFieldData(self.raw_field_data), self.scope_ids
        )

    def test_poll_export_with_unescaped_characters_xml(self):
        """
        Ensure that PollBlock exports unescaped characters correctly in its XML.
        """
        # Set up test runtime and construct a PollBlock instance.
        runtime = TestRuntime()
        block = runtime.construct_xblock(PollBlock)

        # Define a sample poll XML.
        sample_poll_xml = '''
        <poll_question display_name="Poll Question">
            <p>How old are you?</p>
            <answer id="less18">18</answer>
        </poll_question>
        '''
        node = etree.fromstring(sample_poll_xml)

        # Re-parse the block using actual XML input.
        parsed_block = PollBlock.parse_xml(node, runtime, block.scope_ids)

        # Inject an unescaped character into the answer text.
        parsed_block.answers[0]['text'] = '< 18'
        parsed_block.save()

        # Export back to XML and get all text nodes.
        exported_xml = parsed_block.definition_to_xml(None)
        texts = exported_xml.xpath('//text()')

        # Assert that the last text node includes the unescaped string.
        self.assertEqual(texts[-1], '< 18')
