import copy

from xblocks_contrib.video.bumper_utils import get_bumper_settings

NON_EXISTENT_TRANSCRIPT = 'non_existent_dummy_file_name'

try:
    from edxval import api as edxval_api
except ImportError:
    edxval_api = None


def clean_video_id(edx_video_id):
    """
    Cleans an edx video ID.

    Arguments:
        edx_video_id(unicode): edx-val's video identifier
    """
    return edx_video_id and edx_video_id.strip()


def get_available_transcript_languages(edx_video_id):
    """
    Gets available transcript languages for a video.

    Arguments:
        edx_video_id(unicode): edx-val's video identifier

    Returns:
        A list containing distinct transcript language codes against all the passed video ids.
    """
    available_languages = []
    edx_video_id = clean_video_id(edx_video_id)
    if edxval_api and edx_video_id:
        available_languages = edxval_api.get_available_transcript_languages(video_id=edx_video_id)

    return available_languages


class VideoTranscriptsMixin:
    """Mixin class for transcript functionality.

    This is necessary for VideoBlock.
    """

    #
    # def available_translations(self, transcripts, verify_assets=None, is_bumper=False):
    #     """
    #     Return a list of language codes for which we have transcripts.
    #
    #     Arguments:
    #         verify_assets (boolean): If True, checks to ensure that the transcripts
    #             really exist in the contentstore. If False, we just look at the
    #             VideoBlock fields and do not query the contentstore. One reason
    #             we might do this is to avoid slamming contentstore() with queries
    #             when trying to make a listing of videos and their languages.
    #
    #             Defaults to `not FALLBACK_TO_ENGLISH_TRANSCRIPTS`.
    #
    #         transcripts (dict): A dict with all transcripts and a sub.
    #         include_val_transcripts(boolean): If True, adds the edx-val transcript languages as well.
    #     """
    #     translations = []
    #     if verify_assets is None:
    #         verify_assets = not settings.FEATURES.get('FALLBACK_TO_ENGLISH_TRANSCRIPTS')
    #
    #     sub, other_langs = transcripts["sub"], transcripts["transcripts"]
    #
    #     if verify_assets:
    #         all_langs = dict(**other_langs)
    #         if sub:
    #             all_langs.update({'en': sub})
    #
    #         for language, filename in all_langs.items():
    #             try:
    #                 # for bumper videos, transcripts are stored in content store only
    #                 if is_bumper:
    #                     get_transcript_for_video(self.location, filename, filename, language)
    #                 else:
    #                     get_transcript(self, language)
    #             except NotFoundError:
    #                 continue
    #
    #             translations.append(language)
    #     else:
    #         # If we're not verifying the assets, we just trust our field values
    #         translations = list(other_langs)
    #         if not translations or sub:
    #             translations += ['en']
    #
    #     # to clean redundant language codes.
    #     return list(set(translations))
    #
    def get_default_transcript_language(self, transcripts, dest_lang=None):
        """
        Returns the default transcript language for this video block.

        Args:
            transcripts (dict): A dict with all transcripts and a sub.
            dest_lang (unicode): language coming from unit translation language selector.
        """
        sub, other_lang = transcripts["sub"], transcripts["transcripts"]

        # language in plugin selector exists as transcript
        if dest_lang and dest_lang in other_lang.keys():
            transcript_language = dest_lang
        # language in plugin selector is english and empty transcripts or transcripts and sub exists
        elif dest_lang and dest_lang == 'en' and (not other_lang or (other_lang and sub)):
            transcript_language = 'en'
        elif self.transcript_language in other_lang:
            transcript_language = self.transcript_language
        elif sub:
            transcript_language = 'en'
        elif len(other_lang) > 0:
            transcript_language = sorted(other_lang)[0]
        else:
            transcript_language = 'en'
        return transcript_language

    def get_transcripts_info(self, is_bumper=False):
        """
        Returns a transcript dictionary for the video.

        Arguments:
            is_bumper(bool): If True, the request is for the bumper transcripts
            include_val_transcripts(bool): If True, include edx-val transcripts as well
        """
        if is_bumper:
            transcripts = copy.deepcopy(get_bumper_settings(self).get('transcripts', {}))
            sub = transcripts.pop("en", "")
        else:
            transcripts = self.transcripts if self.transcripts else {}
            sub = self.sub

        # Only attach transcripts that are not empty.
        transcripts = {
            language_code: transcript_file
            for language_code, transcript_file in transcripts.items() if transcript_file != ''
        }

        # bumper transcripts are stored in content store so we don't need to include val transcripts
        if not is_bumper:
            transcript_languages = get_available_transcript_languages(edx_video_id=self.edx_video_id)
            # HACK Warning! this is temporary and will be removed once edx-val take over the
            # transcript module and contentstore will only function as fallback until all the
            # data is migrated to edx-val.
            for language_code in transcript_languages:
                if language_code == 'en' and not sub:
                    sub = NON_EXISTENT_TRANSCRIPT
                elif not transcripts.get(language_code):
                    transcripts[language_code] = NON_EXISTENT_TRANSCRIPT

        return {
            "sub": sub,
            "transcripts": transcripts,
        }
