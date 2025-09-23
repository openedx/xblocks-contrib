"""
Video toggles and configuration methods for Video XBlock.

This module contains functions that handle video-related configuration
and feature flags by accessing the VideoConfigService.
"""


def is_hls_playback_enabled(video_block, course_id):
    """Check if HLS playback is enabled."""
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.is_hls_playback_enabled(course_id)
    return False  # TODO: Review it; Default from edx-platform: HLSPlaybackEnabledFlag toggle_default: False


def get_branding_info(video_block):
    """Get branding information."""
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.get_branding_info()
    return {
        'logo_url': None,
        'logo_alt_text': None,
        'favicon_url': None
    }


def get_course_by_id(video_block, course_id):
    """Get course by ID."""
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.get_course_by_id(course_id)
    return None


def get_course_organization(video_block, course_id):
    """Get course organization."""
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.get_course_organization(course_id)
    return None


def is_youtube_deprecated(video_block, course_id):
    """Check if YouTube is deprecated."""
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.is_youtube_deprecated(course_id)
    return False  # Default from edx-platform: DEPRECATE_YOUTUBE toggle_default: False


def is_youtube_blocked_for_course(video_block, course_id):
    """Check if YouTube is blocked for course."""
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.is_youtube_blocked_for_course(course_id)
    return False  # Default from edx-platform: CourseYoutubeBlockedFlag default: False


def is_public_video_share_enabled(video_block, course_id):
    """Check if public video share is enabled."""
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.is_public_video_share_enabled(course_id)
    return False  # Default from edx-platform: PUBLIC_VIDEO_SHARE toggle_default: False


def is_transcript_feedback_enabled(video_block, course_id):
    """Check if transcript feedback is enabled."""
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.is_transcript_feedback_enabled(course_id)
    return False  # Default from edx-platform: TRANSCRIPT_FEEDBACK toggle_default: False
