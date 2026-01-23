from typing import Any
from collections import defaultdict
from unittest.mock import MagicMock
from xblock.core import XBlockAside
from xblock.runtime import Fragment, MemoryIdManager
from xblock.test.tools import TestRuntime
from xblock.validation import ValidationMessage
from xblock.fields import Scope, String, ScopeIds
from xblocks_contrib.video.exceptions import TranscriptNotFoundError
from django.conf import settings
from fs.memoryfs import MemoryFS
from xblock.field_data import DictFieldData


EXPORT_IMPORT_STATIC_DIR = 'static'

def get_test_descriptor_system():
    """
    Construct a minimal test descriptor system for XBlocks.
    """
    return DummyModuleStoreRuntime(services={'video_config': MockedVideoConfigService()})


class StudioValidationMessage(ValidationMessage):
    """
    A message containing validation information about an xblock, extended to provide Studio-specific fields.
    """

    # A special message type indicating that the xblock is not yet configured. This message may be rendered
    # in a different way within Studio.
    NOT_CONFIGURED = "not-configured"

    TYPES = [ValidationMessage.WARNING, ValidationMessage.ERROR, NOT_CONFIGURED]

    def __init__(self, message_type, message_text, action_label=None, action_class=None, action_runtime_event=None):
        """
        Create a new message.

        Args:
            message_type (str): The type associated with this message. Most be `WARNING` or `ERROR`.
            message_text (unicode): The textual message.
            action_label (unicode): Text to show on a "fix-up" action (optional). If present, either `action_class`
                or `action_runtime_event` should be specified.
            action_class (str): A class to link to the "fix-up" action (optional). A click handler must be added
                for this class, unless it is "edit-button", "duplicate-button", or "delete-button" (which are all
                handled in general for xblock instances.
            action_runtime_event (str): An event name to be triggered on the xblock client-side runtime when
                the "fix-up" action is clicked (optional).
        """
        super().__init__(message_type, message_text)
        if action_label is not None:
            if not isinstance(action_label, str):
                raise TypeError("Action label must be unicode.")
            self.action_label = action_label
        if action_class is not None:
            if not isinstance(action_class, str):
                raise TypeError("Action class must be a string.")
            self.action_class = action_class
        if action_runtime_event is not None:
            if not isinstance(action_runtime_event, str):
                raise TypeError("Action runtime event must be a string.")
            self.action_runtime_event = action_runtime_event

    def to_json(self):
        """
        Convert to a json-serializable representation.

        Returns:
            dict: A dict representation that is json-serializable.
        """
        serialized = super().to_json()
        if hasattr(self, "action_label"):
            serialized["action_label"] = self.action_label
        if hasattr(self, "action_class"):
            serialized["action_class"] = self.action_class
        if hasattr(self, "action_runtime_event"):
            serialized["action_runtime_event"] = self.action_runtime_event
        return serialized


class AsideTestType(XBlockAside):
    """
    Test Aside type
    """
    FRAG_CONTENT = "<p>Aside rendered</p>"

    content = String(default="default_content", scope=Scope.content)
    data_field = String(default="default_data", scope=Scope.settings)

    @XBlockAside.aside_for('student_view')
    def student_view_aside(self, block, context):  # pylint: disable=unused-argument
        """Add to the student view"""
        return Fragment(self.FRAG_CONTENT)


class DummyModuleStoreRuntime(TestRuntime):
    def __init__(self, *args, **kwargs):
        # MemoryIdManager is required for TestRuntime to work properly with ScopeIds
        memory_id_manager = MemoryIdManager()
        if not args:
            kwargs.setdefault('id_reader', memory_id_manager)
        kwargs.setdefault('id_generator', memory_id_manager)
        
        # Ignore load_error_blocks as it's not supported by modern TestRuntime
        kwargs.pop('load_error_blocks', None)
        
        # Ensure field-data and video_config services are available
        services = kwargs.setdefault('services', {})
        if 'field-data' not in services:
            services['field-data'] = DictFieldData({})
        if 'video_config' not in services:
            services['video_config'] = MockedVideoConfigService()
            
        super().__init__(*args, **kwargs)
        
        # resources_fs is used in parse_xml and export_to_xml tests
        self.resources_fs = MemoryFS()
        self._asides = defaultdict(list)

    def handler_url(self, block, handler_name, suffix='', query='', thirdparty=False):
        url = f"/handler/{handler_name}"
        if suffix:
            url += f"/{suffix}"
        if query:
            url += f"?{query}"
        return url

    def parse_asides(self, node, definition_id, usage_id, id_generator):
        asides = []
        for child in node:
            if child.get('xblock-family') == 'xblock_asides.v1':
                # Simplified mock parser for tests
                aside_scope_ids = ScopeIds(None, child.tag, definition_id, usage_id)
                aside = AsideTestType(runtime=self, scope_ids=aside_scope_ids)
                aside.tag = child.tag
                for attr, val in child.attrib.items():
                    if attr in aside.fields:
                        setattr(aside, attr, val)
                asides.append(aside)
                self._asides[usage_id].append(aside)
        return asides

    def get_asides(self, block):
        return self._asides.get(block.scope_ids.usage_id, [])

    def get_aside_of_type(self, block, aside_type):
        for aside in self._asides.get(block.scope_ids.usage_id, []):
            return aside
        # Default aside if not found
        aside_scope_ids = ScopeIds(None, aside_type, None, block.scope_ids.usage_id)
        aside = AsideTestType(runtime=self, scope_ids=aside_scope_ids)
        self._asides[block.scope_ids.usage_id].append(aside)
        return aside


class MockedVideoConfigService:
    """
    Service for providing video-related configuration and feature flags.

    This service abstracts away edx-platform specific functionality
    that the Video XBlock needs, allowing the Video XBlock to be
    extracted to a separate repository.
    """

    def get_public_video_url(self, usage_id) -> str:
        """
        Returns the public video url
        """
        return ""

    def get_public_sharing_context(self, video_block, course_key) -> dict:
        """
        Get the complete public sharing context for a video.
        """
        return {}

    def is_transcript_feedback_enabled(self, course_id) -> bool:
        """
        Check if transcript feedback is enabled for the course.
        """
        return False

    def is_youtube_deprecated(self, course_id) -> bool:
        """
        Check if YouTube is deprecated for the course.
        """
        return False

    def is_youtube_blocked_for_course(self, course_id) -> bool:
        """
        Check if YouTube is blocked for the course.
        """
        return False

    def is_hls_playback_enabled(self, course_id) -> bool:
        """
        Check if HLS playback is enabled for the course.
        """
        return False

    def get_transcript(
        self,
        video_block,
        lang: str | None = None,
        output_format: str = 'srt',
        youtube_id: str | None = None,
        is_bumper=False,
    ) -> tuple[Any, str, str]:
        """
        Retrieve a transcript from the runtime's storage.
        """
        # Canned responses for index_dictionary tests
        content = ""
        if output_format == 'txt' or output_format == 'srt':
            if lang == 'ge':
                content = "sprechen sie deutsch?\nJa, ich spreche Deutsch"
            elif lang == 'hr':
                content = "Dobar dan!\nKako ste danas?"
            elif lang == 'en' or lang is None:
                content = "Sample transcript"
        
        return content, f"transcript_{lang}.{output_format}", "text/plain"

    def available_translations(
        self,
        video_block,
        transcripts: dict[str, Any],
        verify_assets: bool | None = None,
        is_bumper: bool = False,
    ) -> list[str]:
        """
        Return a list of language codes for which we have transcripts.
        """
        sub, other_langs = transcripts["sub"], transcripts["transcripts"]
        translations = list(other_langs)

        fallback_enabled = settings.FEATURES.get('FALLBACK_TO_ENGLISH_TRANSCRIPTS', True)

        if fallback_enabled:
            if not translations or sub:
                translations.append('en')
        elif sub:
            translations.append('en')

        return list(set(translations))

    def upload_transcript(
        self,
        *,
        video_block,
        language_code: str,
        new_language_code: str | None,
        transcript_file,
        edx_video_id: str | None,
    ) -> None:
        """
        Store a transcript, however the runtime prefers to.
        """
        pass

    def delete_transcript(
        self,
        *,
        video_block,
        edx_video_id: str | None,
        language_code: str,
    ) -> None:
        """
        Delete a transcript from the runtime's storage.
        """
        pass
