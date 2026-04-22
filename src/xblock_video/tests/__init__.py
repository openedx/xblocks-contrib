"""
Tests for the video xblock.
"""

from unittest.mock import Mock

from ..video import VideoBlock

VideoBlock.add_aside = Mock()
