"""
Video toggles and configuration methods for Video XBlock.

This module contains functions that handle video-related configuration
and feature flags by accessing the VideoConfigService.
"""

from xblocks_contrib.video.exceptions import ServiceUnavailable


def is_hls_playback_enabled(video_block, course_id):
    """Check if HLS playback is enabled."""
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.is_hls_playback_enabled(course_id)
    return False  # TODO: Review it; Default from edx-platform: HLSPlaybackEnabledFlag toggle_default: False


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


def is_transcript_feedback_enabled(video_block, course_id):
    """Check if transcript feedback is enabled."""
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.is_transcript_feedback_enabled(course_id)
    return False  # Default from edx-platform: TRANSCRIPT_FEEDBACK toggle_default: False


def get_public_sharing_context(video_block, course_id):
    """
    Get the complete public sharing context for a video.
    
    Args:
        video_block: The video XBlock instance
        course_id: The course identifier
        
    Returns:
        dict: Context dictionary with sharing information, empty if sharing is disabled
    """
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.get_public_sharing_context(video_block, course_id)
    return {}


def get_component_version(video_block, usage_key):
    """
    Get the component version for a given usage key.
        
    Args:
        video_block: The video XBlock instance
        usage_key: The usage key for the XBlock component
        
    Returns:
        ComponentVersion: The draft version of the component
        
    Raises:
        NotFoundError: If the component was soft-deleted or doesn't exist
        ServiceUnavailable: If the video_config service is not available
    """
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.get_component_version(usage_key)
    
    raise ServiceUnavailable("Video config service is not available")


def get_youtube_metadata(video_block, video_id, request):
    """
    Get YouTube metadata for a given video ID.
        
    Args:
        video_block: The video XBlock instance
        video_id: The YouTube video ID
        request: The HTTP request object
        
    Returns:
        tuple: (metadata_dict, status_code)
        
    Raises:
        ServiceUnavailable: If the video_config service is not available
    """
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.get_youtube_metadata(video_id, request)
    
    raise ServiceUnavailable("Video config service is not available")


def add_library_static_asset(video_block, usage_key, filename, content):
    """
    Add a static asset file to a library component.
        
    Args:
        video_block: The video XBlock instance
        usage_key: The usage key for the XBlock component
        filename: The filename for the asset
        content: The binary content of the asset
        
    Returns:
        bool: True if successful, False otherwise
        
    Raises:
        ServiceUnavailable: If the video_config service is not available
    """
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.add_library_static_asset(usage_key, filename, content)

    raise ServiceUnavailable("Video config service is not available")


def delete_library_static_asset(video_block, usage_key, filename):
    """
    Delete a static asset file from a library component.
                
    Args:
        video_block: The video XBlock instance
        usage_key: The usage key for the XBlock component
        filename: The filename of the asset to delete
        
    Returns:
        bool: True if successful, False otherwise
        
    Raises:
        ServiceUnavailable: If the video_config service is not available
    """
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.delete_library_static_asset(usage_key, filename)
    
    raise ServiceUnavailable("Video config service is not available")


def get_transcript(video_block, course_key, filename):
    """
    Get a transcript asset from storage.
    
    Args:
        video_block: The video XBlock instance
        course_key: The course key for the transcript
        filename: The filename of the transcript
        
    Returns:
        Asset object with transcript data
        
    Raises:
        ServiceUnavailable: If the video_config service is not available
        NotFoundError: If asset not found
    """
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.get_transcript(course_key, filename)
    
    raise ServiceUnavailable("Video config service is not available")


def delete_transcript(video_block, course_key, filename):
    """
    Delete a transcript asset from storage.
    
    Args:
        video_block: The video XBlock instance
        course_key: The course key for the transcript
        filename: The filename of the transcript to delete
        
    Returns:
        Asset location
        
    Raises:
        ServiceUnavailable: If the video_config service is not available
    """
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.delete_transcript(course_key, filename)
    
    raise ServiceUnavailable("Video config service is not available")


def find_transcript(video_block, course_key, filename):
    """
    Find and retrieve a transcript asset from storage.
    
    Args:
        video_block: The video XBlock instance
        course_key: The course key for the transcript
        filename: The filename of the transcript to find
        
    Returns:
        Asset object with transcript data if found
        
    Raises:
        ServiceUnavailable: If the video_config service is not available
    """
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.find_transcript(course_key, filename)
    
    raise ServiceUnavailable("Video config service is not available")


def save_transcript(video_block, content, filename, mime_type, course_key):
    """
    Save named content to store by course_key.
    
    Args:
        video_block: The video XBlock instance
        content: The content to save
        filename: The filename
        mime_type: The MIME type of the content
        course_key: The course key
        
    Returns:
        Content location of saved content
        
    Raises:
        ServiceUnavailable: If the video_config service is not available
    """
    video_config_service = video_block.runtime.service(video_block, 'video_config')
    if video_config_service:
        return video_config_service.save_transcript(content, filename, mime_type, course_key)
    
    raise ServiceUnavailable("Video config service is not available")
