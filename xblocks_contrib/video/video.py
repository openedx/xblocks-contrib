"""Video is ungraded Xmodule for support video content.
It's new improved video block, which support additional feature:
- Can play non-YouTube video sources via in-browser HTML5 video player.
- YouTube defaults to HTML5 mode from the start.
- Speed changes in both YouTube and non-YouTube videos happen via
in-browser HTML5 video method (when in HTML5 mode).
- Navigational subtitles can be disabled altogether via an attribute
in XML.
Examples of html5 videos for manual testing:
    https://s3.amazonaws.com/edx-course-videos/edx-intro/edX-FA12-cware-1_100.mp4
    https://s3.amazonaws.com/edx-course-videos/edx-intro/edX-FA12-cware-1_100.webm
    https://s3.amazonaws.com/edx-course-videos/edx-intro/edX-FA12-cware-1_100.ogv
"""
import json
import logging
import uuid
from collections import OrderedDict
from operator import itemgetter

from django.conf import settings
from django.utils.translation import gettext_noop as _
from edx_django_utils.cache import RequestCache
from web_fragments.fragment import Fragment
from xblock.completable import XBlockCompletionMode
from xblock.core import XBlock
from xblock.utils.resources import ResourceLoader

from xblocks_contrib.utils.utils import display_name_with_default
from xblocks_contrib.video.bumper_utils import bumperize
from xblocks_contrib.video.constants import ATTR_KEY_USER_ID, ATTR_KEY_REQUEST_COUNTRY_CODE, PUBLIC_VIEW, STUDENT_VIEW
from xblocks_contrib.video.transcripts_utils import VideoTranscriptsMixin
from xblocks_contrib.video.video_handlers import VideoStudioViewHandlers, VideoStudentViewHandlers
from xblocks_contrib.video.video_utils import rewrite_video_url, create_youtube_string
from xblocks_contrib.video.video_xfields import VideoFields

# The following import/except block for edxval is temporary measure until
# edxval is a proper XBlock Runtime Service.
#
# Here's the deal: the VideoBlock should be able to take advantage of edx-val
# (https://github.com/openedx/edx-val) to figure out what URL to give for video
# resources that have an edx_video_id specified. edx-val is a Django app, and
# including it causes tests to fail because we run common/lib tests standalone
# without Django dependencies. The alternatives seem to be:
#
# 1. Move VideoBlock out of edx-platform.
# 2. Accept the Django dependency in common/lib.
# 3. Try to import, catch the exception on failure, and check for the existence
#    of edxval_api before invoking it in the code.
# 4. Make edxval an XBlock Runtime Service
#
# (1) is a longer term goal. VideoBlock should be made into an XBlock and
# extracted from edx-platform entirely. But that's expensive to do because of
# the various dependencies (like templates). Need to sort this out.
# (2) is explicitly discouraged.
# (3) is what we're doing today. The code is still functional when called within
# the context of the LMS, but does not cause failure on import when running
# standalone tests. Most VideoBlock tests tend to be in the LMS anyway,
# probably for historical reasons, so we're not making things notably worse.
# (4) is one of the next items on the backlog for edxval, and should get rid
# of this particular import silliness. It's just that I haven't made one before,
# and I was worried about trying it with my deadline constraints.
try:
    import edxval.api as edxval_api
except ImportError:
    edxval_api = None

log = logging.getLogger(__name__)
resource_loader = ResourceLoader(__name__)


@XBlock.wants('settings', 'completion', 'i18n')
@XBlock.needs("i18n", 'user')
class VideoBlock(
    VideoFields, VideoTranscriptsMixin,
    VideoStudioViewHandlers, VideoStudentViewHandlers,
    XBlock):
    """
    XML source example:
        <video show_captions="true"
            youtube="0.75:jNCf2gIqpeE,1.0:ZwkTiUPN0mg,1.25:rsq9auxASqI,1.50:kMyNdzVHHgg"
            url_name="lecture_21_3" display_name="S19V3: Vacancies"
        >
            <source src=".../mit-3091x/M-3091X-FA12-L21-3_100.mp4"/>
            <source src=".../mit-3091x/M-3091X-FA12-L21-3_100.webm"/>
            <source src=".../mit-3091x/M-3091X-FA12-L21-3_100.ogv"/>
        </video>
    """

    # Indicates that this XBlock has been extracted from edx-platform.
    is_extracted = False
    has_custom_completion = True
    completion_mode = XBlockCompletionMode.COMPLETABLE

    video_time = 0
    icon_class = 'video'

    show_in_read_only_mode = True

    @property
    def ajax_url(self):
        """
        Returns the URL for the ajax handler.
        """
        # TODO: remove this ajax_url property
        return 'update-url'

    tabs = [
        {
            'name': _("Basic"),
            'template': "video/transcripts.html",
            'current': True
        },
        {
            'name': _("Advanced"),
            'template': "tabs/metadata-edit-tab.html"
        }
    ]

    mako_template = "widgets/tabs-aggregator.html"
    js_module_name = "TabsEditingDescriptor"

    uses_xmodule_styles_setup = True

    def get_transcripts_for_student(self, transcripts, dest_lang=None):
        """Return transcript information necessary for rendering the XModule student view.
        This is more or less a direct extraction from `get_html`.

        Args:
            transcripts (dict): A dict with all transcripts and a sub.

        Returns:
            Tuple of (track_url, transcript_language, sorted_languages)
            track_url -> subtitle download url
            transcript_language -> default transcript language
            sorted_languages -> dictionary of available transcript languages
        """
        track_url = None
        sub, other_lang = transcripts["sub"], transcripts["transcripts"]
        if self.download_track:
            if self.track:
                track_url = self.track
            elif sub or other_lang:
                track_url = self.runtime.handler_url(self, 'transcript', 'download').rstrip('/?')

        transcript_language = self.get_default_transcript_language(transcripts, dest_lang)
        native_languages = {lang: label for lang, label in settings.LANGUAGES if len(lang) == 2}
        languages = {
            lang: native_languages.get(lang, display)
            for lang, display in settings.ALL_LANGUAGES
            if lang in other_lang
        }

        if not other_lang or (other_lang and sub):
            languages['en'] = 'English'

        # OrderedDict for easy testing of rendered context in tests
        sorted_languages = sorted(list(languages.items()), key=itemgetter(1))

        sorted_languages = OrderedDict(sorted_languages)
        return track_url, transcript_language, sorted_languages

    @property
    def youtube_deprecated(self):
        """
        Return True if youtube is deprecated and hls as primary playback is enabled else False
        """
        # # Return False if `hls` playback feature is disabled.
        # if not HLSPlaybackEnabledFlag.feature_enabled(self.location.course_key):
        #     return False
        #
        # # check if youtube has been deprecated and hls as primary playback
        # # is enabled for this course
        # return DEPRECATE_YOUTUBE.is_enabled(self.location.course_key)
        # TODO: Implement this method
        return True

    def youtube_disabled_for_course(self):  # lint-amnesty, pylint: disable=missing-function-docstring
        if not self.location.context_key.is_course:
            return False  # Only courses have this flag
        request_cache = RequestCache('youtube_disabled_for_course')
        cache_response = request_cache.get_cached_response(self.location.context_key)
        if cache_response.is_found:
            return cache_response.value

        # TODO: Un comment following as its linked to model
        # youtube_is_disabled = CourseYoutubeBlockedFlag.feature_enabled(self.location.course_key)
        youtube_is_disabled = True
        request_cache.set(self.location.context_key, youtube_is_disabled)
        return youtube_is_disabled

    def prioritize_hls(self, youtube_streams, html5_sources):
        """
        Decide whether hls can be prioritized as primary playback or not.

        If both the youtube and hls sources are present then make decision on flag
        If only either youtube or hls is present then play whichever is present
        """
        yt_present = bool(youtube_streams.strip()) if youtube_streams else False
        hls_present = any(source for source in html5_sources)

        if yt_present and hls_present:
            return self.youtube_deprecated

        return False

    def get_context(self, view=STUDENT_VIEW, context=None):
        context = context or {}
        track_status = (self.download_track and self.track)
        transcript_download_format = self.transcript_download_format if not track_status else None
        sources = [source for source in self.html5_sources if source]

        download_video_link = None
        branding_info = None
        youtube_streams = ""
        video_duration = None
        video_status = None

        # Determine if there is an alternative source for this video
        # based on user locale.  This exists to support cases where
        # we leverage a geography specific CDN, like China.
        default_cdn_url = getattr(settings, 'VIDEO_CDN_URL', {}).get('default')
        user = self.runtime.service(self, 'user').get_current_user()
        user_location = self.runtime.service(self, 'user').get_current_user().opt_attrs[ATTR_KEY_REQUEST_COUNTRY_CODE]
        cdn_url = getattr(settings, 'VIDEO_CDN_URL', {}).get(user_location, default_cdn_url)

        # If we have an edx_video_id, we prefer its values over what we store
        # internally for download links (source, html5_sources) and the youtube
        # stream.
        if self.edx_video_id and edxval_api:  # lint-amnesty, pylint: disable=too-many-nested-blocks
            try:
                val_profiles = ["youtube", "desktop_webm", "desktop_mp4"]

                # TODO: Un comment following code
                # if HLSPlaybackEnabledFlag.feature_enabled(self.course_id):
                #     val_profiles.append('hls')

                # strip edx_video_id to prevent ValVideoNotFoundError error if unwanted spaces are there. TNL-5769
                val_video_urls = edxval_api.get_urls_for_profiles(self.edx_video_id.strip(), val_profiles)

                # VAL will always give us the keys for the profiles we asked for, but
                # if it doesn't have an encoded video entry for that Video + Profile, the
                # value will map to `None`

                # add the non-youtube urls to the list of alternative sources
                # use the last non-None non-youtube non-hls url as the link to download the video
                for url in [val_video_urls[p] for p in val_profiles if p != "youtube"]:
                    if url:
                        if url not in sources:
                            sources.append(url)
                        # don't include hls urls for download
                        if self.download_video and not url.endswith('.m3u8'):
                            # function returns None when the url cannot be re-written
                            rewritten_link = rewrite_video_url(cdn_url, url)
                            if rewritten_link:
                                download_video_link = rewritten_link
                            else:
                                download_video_link = url

                # set the youtube url
                if val_video_urls["youtube"]:
                    youtube_streams = "1.00:{}".format(val_video_urls["youtube"])

                # get video duration
                video_data = edxval_api.get_video_info(self.edx_video_id.strip())
                video_duration = video_data.get('duration')
                video_status = video_data.get('status')

            except (edxval_api.ValInternalError, edxval_api.ValVideoNotFoundError):
                # VAL raises this exception if it can't find data for the edx video ID. This can happen if the
                # course data is ported to a machine that does not have the VAL data. So for now, pass on this
                # exception and fallback to whatever we find in the VideoBlock.
                log.warning("Could not retrieve information from VAL for edx Video ID: %s.", self.edx_video_id)

        # If the user comes from China use China CDN for html5 videos.
        # 'CN' is China ISO 3166-1 country code.
        # Video caching is disabled for Studio. User_location is always None in Studio.
        # CountryMiddleware disabled for Studio.
        if getattr(self, 'video_speed_optimizations', True) and cdn_url:
            # TODO: Un comment the following line of code
            # branding_info = BrandingInfoConfig.get_config().get(user_location)

            if self.edx_video_id and edxval_api and video_status != 'external':
                for index, source_url in enumerate(sources):
                    new_url = rewrite_video_url(cdn_url, source_url)
                    if new_url:
                        sources[index] = new_url

        # If there was no edx_video_id, or if there was no download specified
        # for it, we fall back on whatever we find in the VideoBlock.
        if not download_video_link and self.download_video:
            if self.html5_sources:
                # If there are multiple html5 sources, we use the first non HLS video urls
                download_video_link = next((url for url in self.html5_sources if not url.endswith('.m3u8')), None)

        transcripts = self.get_transcripts_info()
        track_url, transcript_language, sorted_languages = self.get_transcripts_for_student(
            transcripts=transcripts,
            dest_lang=context.get("dest_lang")
        )

        cdn_eval = False
        cdn_exp_group = None

        if self.youtube_disabled_for_course():
            self.youtube_streams = ''  # lint-amnesty, pylint: disable=attribute-defined-outside-init
        else:
            self.youtube_streams = youtube_streams or create_youtube_string(self)  # pylint: disable=W0201

        # TODO: Double check this removal of unused code of line
        # settings_service = self.runtime.service(self, 'settings')  # lint-amnesty, pylint: disable=unused-variable

        poster = self._poster()
        completion_service = self.runtime.service(self, 'completion')
        if completion_service:
            completion_enabled = completion_service.completion_tracking_enabled()
        else:
            completion_enabled = False

        # This is the setting that controls whether the autoadvance button will be visible, not whether the
        # video will autoadvance or not.
        # For autoadvance controls to be shown, both the feature flag and the course setting must be true.
        # This allows to enable the feature for certain courses only.
        autoadvance_enabled = settings.FEATURES.get('ENABLE_AUTOADVANCE_VIDEOS', False) and \
                              getattr(self, 'video_auto_advance', False)

        # This is the current status of auto-advance (not the control visibility).
        # But when controls aren't visible we force it to off. The student might have once set the preference to
        # true, but now staff or admin have hidden the autoadvance button and the student won't be able to disable
        # it anymore; therefore we force-disable it in this case (when controls aren't visible).
        autoadvance_this_video = self.auto_advance and autoadvance_enabled
        is_embed = context.get('public_video_embed', False)
        is_public_view = view == PUBLIC_VIEW

        metadata = {
            'autoAdvance': autoadvance_this_video,
            # For now, the option "data-autohide-html5" is hard coded. This option
            # either enables or disables autohiding of controls and captions on mouse
            # inactivity. If set to true, controls and captions will autohide for
            # HTML5 sources (non-YouTube) after a period of mouse inactivity over the
            # whole video. When the mouse moves (or a key is pressed while any part of
            # the video player is focused), the captions and controls will be shown
            # once again.
            #
            # There is no option in the "Advanced Editor" to set this option. However,
            # this option will have an effect if changed to "True". The code on
            # front-end exists.
            'autohideHtml5': False,
            'autoplay': settings.FEATURES.get('AUTOPLAY_VIDEOS', False),
            # This won't work when we move to data that
            # isn't on the filesystem
            'captionDataDir': getattr(self, 'data_dir', None),
            'completionEnabled': completion_enabled,
            'completionPercentage': settings.COMPLETION_VIDEO_COMPLETE_PERCENTAGE,
            'duration': video_duration,
            'end': self.end_time.total_seconds(),  # pylint: disable=no-member
            'generalSpeed': self.global_speed,
            'lmsRootURL': settings.LMS_ROOT_URL,
            'poster': poster,
            'prioritizeHls': self.prioritize_hls(self.youtube_streams, sources),
            'publishCompletionUrl': self.runtime.handler_url(self, 'publish_completion', '').rstrip('?'),
            # This is the server's guess at whether youtube is available for
            # this user, based on what was recorded the last time we saw the
            # user, and defaulting to True.
            'recordedYoutubeIsAvailable': self.youtube_is_available,
            'savedVideoPosition': self.saved_video_position.total_seconds(),  # pylint: disable=no-member
            'saveStateEnabled': not is_public_view,
            'saveStateUrl': self.ajax_url + '/save_user_state',
            # Despite the setting on the block, don't show transcript by default
            # if the video is embedded in social media
            'showCaptions': json.dumps(self.show_captions and not is_embed),
            'sources': sources,
            'speed': self.speed,
            'start': self.start_time.total_seconds(),  # pylint: disable=no-member
            'streams': self.youtube_streams,
            'transcriptAvailableTranslationsUrl': self.runtime.handler_url(
                self, 'transcript', 'available_translations'
            ).rstrip('/?'),
            'aiTranslationsUrl': settings.AI_TRANSLATIONS_API_URL,
            'transcriptLanguage': transcript_language,
            'transcriptLanguages': sorted_languages,
            'transcriptTranslationUrl': self.runtime.handler_url(
                self, 'transcript', 'translation/__lang__'
            ).rstrip('/?'),
            'ytApiUrl': settings.YOUTUBE['API'],
            'ytMetadataEndpoint': (
                # In the new runtime, get YouTube metadata via a handler. The handler supports anonymous users and
                # can work in sandboxed iframes. In the old runtime, the JS will call the LMS's yt_video_metadata
                # API endpoint directly (not an XBlock handler).
                self.runtime.handler_url(self, 'yt_video_metadata')
                if getattr(self.runtime, 'suppports_state_for_anonymous_users', False) else ''
            ),
            'ytTestTimeout': settings.YOUTUBE['TEST_TIMEOUT'],
        }

        bumperize(self)

        # TODO: Complete this template_context
        template_context = {
            # 'autoadvance_enabled': autoadvance_enabled,
            # 'branding_info': branding_info,
            # 'bumper_metadata': json.dumps(self.bumper['metadata']),  # pylint: disable=E1101
            # TODO: Review this id as uuid
            # 'metadata': json.dumps(OrderedDict(metadata)),
            # 'poster': json.dumps(get_poster(self)),
            'display_name': display_name_with_default(self),
            'id': uuid.uuid1(0),
            'block_id': str(self.scope_ids.usage_id),
            'course_id': str(self.context_key),
            'video_id': str(self.edx_video_id),
            'user_id': self.get_user_id(),
        }
        return template_context

    def student_view(self, context=None):
        """
        Create primary view of the VideoBlock, shown to students when viewing courses.
        """

        frag = Fragment()
        frag.add_content(
            resource_loader.render_django_template(
                "templates/video.html",
                self.get_context(context=context),
                i18n_service=self.runtime.service(self, "i18n"),
            )
        )

        # frag.add_css(self.resource_string("static/css/video.css"))
        # frag.add_javascript(self.resource_string("static/js/src/video.js"))
        # frag.initialize_js("VideoBlock")
        return frag

    def get_user_id(self):
        return self.runtime.service(self, 'user').get_current_user().opt_attrs.get(ATTR_KEY_USER_ID)

    def _poster(self):
        """
        Helper to get poster info from edxval
        """
        if edxval_api and self.edx_video_id:
            return edxval_api.get_course_video_image_url(
                course_id=self.scope_ids.usage_id.context_key.for_branch(None),
                edx_video_id=self.edx_video_id.strip()
            )
        return None

    @staticmethod
    def workbench_scenarios():
        """Create canned scenario for display in the workbench."""
        return [
            (
                "VideoBlock",
                """<_video_extracted/>
                """,
            ),
            (
                "Multiple VideoBlock",
                """<vertical_demo>
                <_video_extracted/>
                <_video_extracted/>
                <_video_extracted/>
                </vertical_demo>
                """,
            ),
        ]
