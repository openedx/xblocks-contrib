"""
Tests for VideoBlock
"""


from django.test import TestCase
from xblock.fields import ScopeIds
from xblock.test.toy_runtime import ToyRuntime

from xblocks_contrib import VideoBlock


class TestVideoBlock(TestCase):
    """Tests for VideoBlock"""

    def test_my_student_view(self):
        """Test the basic view loads."""
        scope_ids = ScopeIds("1", "2", "3", "4")
        block = VideoBlock(ToyRuntime(), scope_ids=scope_ids)
        frag = block.student_view()
        as_dict = frag.to_dict()
        content = as_dict["content"]
        self.assertIn(
            "VideoBlock: count is now",
            content,
            "XBlock did not render correct student view",
        )
