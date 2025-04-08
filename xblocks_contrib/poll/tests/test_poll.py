"""
Tests for PollBlock
"""

import json

from django.test import TestCase
from opaque_keys.edx.keys import CourseKey
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
        Make sure that poll_block will export fine if its xml contains
        unescaped characters.
        """
        # This test is currently a placeholder.
        assert True
