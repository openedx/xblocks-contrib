"""
Tests for video toggles functions.
"""

import unittest
from unittest.mock import Mock, MagicMock

from xblocks_contrib.video.toggles import (
    is_hls_playback_enabled,
    get_branding_info,
    get_course_by_id,
    get_course_organization
)


class TestVideoToggles(unittest.TestCase):
    """Test cases for video toggles functions."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.video_block = Mock()
        self.video_block.runtime = Mock()
    
    def test_is_hls_playback_enabled_with_service(self):
        """Test HLS playback enabled with service available."""
        mock_service = Mock()
        mock_service.is_hls_playback_enabled.return_value = True
        self.video_block.runtime.service.return_value = mock_service
        
        result = is_hls_playback_enabled(self.video_block)
        self.assertTrue(result)
        self.video_block.runtime.service.assert_called_once_with(self.video_block, 'video_config')
        mock_service.is_hls_playback_enabled.assert_called_once()
    
    def test_is_hls_playback_enabled_without_service(self):
        """Test HLS playback enabled without service."""
        self.video_block.runtime.service.return_value = None
        
        result = is_hls_playback_enabled(self.video_block)
        self.assertFalse(result)  # Default value from edx-platform
    
    
    def test_get_branding_info_with_service(self):
        """Test branding info with service available."""
        mock_service = Mock()
        expected_info = {'logo_url': 'test.png', 'logo_alt_text': 'Test', 'favicon_url': 'favicon.ico'}
        mock_service.get_branding_info.return_value = expected_info
        self.video_block.runtime.service.return_value = mock_service
        
        result = get_branding_info(self.video_block)
        self.assertEqual(result, expected_info)
        mock_service.get_branding_info.assert_called_once()
    
    def test_get_branding_info_without_service(self):
        """Test branding info without service."""
        self.video_block.runtime.service.return_value = None
        
        result = get_branding_info(self.video_block)
        expected = {
            'logo_url': None,
            'logo_alt_text': None,
            'favicon_url': None
        }
        self.assertEqual(result, expected)
    
    def test_get_course_by_id_with_service(self):
        """Test get course by ID with service available."""
        mock_service = Mock()
        mock_course = Mock()
        mock_service.get_course_by_id.return_value = mock_course
        self.video_block.runtime.service.return_value = mock_service
        
        course_id = Mock()
        result = get_course_by_id(self.video_block, course_id)
        self.assertEqual(result, mock_course)
        mock_service.get_course_by_id.assert_called_once_with(course_id)
    
    def test_get_course_by_id_without_service(self):
        """Test get course by ID without service."""
        self.video_block.runtime.service.return_value = None
        
        course_id = Mock()
        result = get_course_by_id(self.video_block, course_id)
        self.assertIsNone(result)
    
    def test_get_course_organization_with_service(self):
        """Test get course organization with service available."""
        mock_service = Mock()
        mock_service.get_course_organization.return_value = 'edx'
        self.video_block.runtime.service.return_value = mock_service
        
        course_id = Mock()
        result = get_course_organization(self.video_block, course_id)
        self.assertEqual(result, 'edx')
        mock_service.get_course_organization.assert_called_once_with(course_id)
    
    def test_get_course_organization_without_service(self):
        """Test get course organization without service."""
        self.video_block.runtime.service.return_value = None
        
        course_id = Mock()
        result = get_course_organization(self.video_block, course_id)
        self.assertIsNone(result)
