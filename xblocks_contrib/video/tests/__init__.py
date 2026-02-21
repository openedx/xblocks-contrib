"""
Tests for the video xblock.
"""

from unittest.mock import Mock

from xblocks_contrib.video.video import VideoBlock

VideoBlock.add_aside = Mock()
