# import copy
# import html
# import logging
# import os
# import pathlib
# import re
# from functools import wraps
#
# import requests
# import simplejson as json
# from django.conf import settings
# from django.core.exceptions import ObjectDoesNotExist
# from lxml import etree
# from opaque_keys.edx.keys import UsageKeyV2
# from pysrt import SubRipFile, SubRipItem, SubRipTime
# from pysrt.srtexc import Error
#
# from xblocks_contrib.video.bumper_utils import get_bumper_settings
# from xblocks_contrib.video.content import StaticContent
# from xblocks_contrib.video.django import contentstore
# from xblocks_contrib.video.exceptions import NotFoundError
#
# try:
#     from edxval import api as edxval_api
# except ImportError:
#     edxval_api = None
#
# log = logging.getLogger(__name__)
#
# NON_EXISTENT_TRANSCRIPT = 'non_existent_dummy_file_name'
#
#
# class TranscriptException(Exception):
#     pass
#
#
# class TranscriptsGenerationException(Exception):
#     pass
#
#
# class GetTranscriptsFromYouTubeException(Exception):
#     pass
#
#
# class TranscriptsRequestValidationException(Exception):
#     pass
#
#
# def generate_subs_from_source(speed_subs, subs_type, subs_filedata, block, language='en'):
#     """Generate transcripts from source files (like SubRip format, etc.)
#     and save them to assets for `item` module.
#     We expect, that speed of source subs equal to 1
#
#     :param speed_subs: dictionary {speed: sub_id, ...}
#     :param subs_type: type of source subs: "srt", ...
#     :param subs_filedata:unicode, content of source subs.
#     :param block: course or block.
#     :param language: str, language of translation of transcripts
#     :returns: True, if all subs are generated and saved successfully.
#     """
#     _ = block.runtime.service(block, "i18n").gettext
#     if subs_type.lower() != 'srt':
#         raise TranscriptsGenerationException(_("We support only SubRip (*.srt) transcripts format."))
#     try:
#         srt_subs_obj = SubRipFile.from_string(subs_filedata)
#     except Exception as ex:
#         msg = _("Something wrong with SubRip transcripts file during parsing. Inner message is {error_message}").format(
#             error_message=str(ex)
#         )
#         raise TranscriptsGenerationException(msg)  # lint-amnesty, pylint: disable=raise-missing-from
#     if not srt_subs_obj:
#         raise TranscriptsGenerationException(_("Something wrong with SubRip transcripts file during parsing."))
#
#     sub_starts = []
#     sub_ends = []
#     sub_texts = []
#
#     for sub in srt_subs_obj:
#         sub_starts.append(sub.start.ordinal)
#         sub_ends.append(sub.end.ordinal)
#         sub_texts.append(sub.text.replace('\n', ' '))
#
#     subs = {
#         'start': sub_starts,
#         'end': sub_ends,
#         'text': sub_texts}
#
#     for speed, subs_id in speed_subs.items():
#         save_subs_to_store(
#             generate_subs(speed, 1, subs),
#             subs_id,
#             block,
#             language
#         )
#
#     return subs
#
#
# def generate_sjson_for_all_speeds(block, user_filename, result_subs_dict, lang):
#     """
#     Generates sjson from srt for given lang.
#     """
#     _ = block.runtime.service(block, "i18n").gettext
#
#     try:
#         srt_transcripts = contentstore().find(Transcript.asset_location(block.location, user_filename))
#     except NotFoundError as ex:
#         raise TranscriptException(_("{exception_message}: Can't find uploaded transcripts: {user_filename}").format(
#             # lint-amnesty, pylint: disable=raise-missing-from
#             exception_message=str(ex),
#             user_filename=user_filename
#         ))
#
#     if not lang:
#         lang = block.transcript_language
#
#     # Used utf-8-sig encoding type instead of utf-8 to remove BOM(Byte Order Mark), e.g. U+FEFF
#     generate_subs_from_source(
#         result_subs_dict,
#         os.path.splitext(user_filename)[1][1:],
#         srt_transcripts.data.decode('utf-8-sig'),
#         block,
#         lang
#     )
#
#
# def clean_video_id(edx_video_id):
#     """
#     Cleans an edx video ID.
#
#     Arguments:
#         edx_video_id(unicode): edx-val's video identifier
#     """
#     return edx_video_id and edx_video_id.strip()
#
#
# def get_available_transcript_languages(edx_video_id):
#     """
#     Gets available transcript languages for a video.
#
#     Arguments:
#         edx_video_id(unicode): edx-val's video identifier
#
#     Returns:
#         A list containing distinct transcript language codes against all the passed video ids.
#     """
#     available_languages = []
#     edx_video_id = clean_video_id(edx_video_id)
#     if edxval_api and edx_video_id:
#         available_languages = edxval_api.get_available_transcript_languages(video_id=edx_video_id)
#
#     return available_languages
#
#
# class VideoTranscriptsMixin:
#     """Mixin class for transcript functionality.
#
#     This is necessary for VideoBlock.
#     """
#
#     #
#     # def available_translations(self, transcripts, verify_assets=None, is_bumper=False):
#     #     """
#     #     Return a list of language codes for which we have transcripts.
#     #
#     #     Arguments:
#     #         verify_assets (boolean): If True, checks to ensure that the transcripts
#     #             really exist in the contentstore. If False, we just look at the
#     #             VideoBlock fields and do not query the contentstore. One reason
#     #             we might do this is to avoid slamming contentstore() with queries
#     #             when trying to make a listing of videos and their languages.
#     #
#     #             Defaults to `not FALLBACK_TO_ENGLISH_TRANSCRIPTS`.
#     #
#     #         transcripts (dict): A dict with all transcripts and a sub.
#     #         include_val_transcripts(boolean): If True, adds the edx-val transcript languages as well.
#     #     """
#     #     translations = []
#     #     if verify_assets is None:
#     #         verify_assets = not settings.FEATURES.get('FALLBACK_TO_ENGLISH_TRANSCRIPTS')
#     #
#     #     sub, other_langs = transcripts["sub"], transcripts["transcripts"]
#     #
#     #     if verify_assets:
#     #         all_langs = dict(**other_langs)
#     #         if sub:
#     #             all_langs.update({'en': sub})
#     #
#     #         for language, filename in all_langs.items():
#     #             try:
#     #                 # for bumper videos, transcripts are stored in content store only
#     #                 if is_bumper:
#     #                     get_transcript_for_video(self.location, filename, filename, language)
#     #                 else:
#     #                     get_transcript(self, language)
#     #             except NotFoundError:
#     #                 continue
#     #
#     #             translations.append(language)
#     #     else:
#     #         # If we're not verifying the assets, we just trust our field values
#     #         translations = list(other_langs)
#     #         if not translations or sub:
#     #             translations += ['en']
#     #
#     #     # to clean redundant language codes.
#     #     return list(set(translations))
#     #
#     def get_default_transcript_language(self, transcripts, dest_lang=None):
#         """
#         Returns the default transcript language for this video block.
#
#         Args:
#             transcripts (dict): A dict with all transcripts and a sub.
#             dest_lang (unicode): language coming from unit translation language selector.
#         """
#         sub, other_lang = transcripts["sub"], transcripts["transcripts"]
#
#         # language in plugin selector exists as transcript
#         if dest_lang and dest_lang in other_lang.keys():
#             transcript_language = dest_lang
#         # language in plugin selector is english and empty transcripts or transcripts and sub exists
#         elif dest_lang and dest_lang == 'en' and (not other_lang or (other_lang and sub)):
#             transcript_language = 'en'
#         elif self.transcript_language in other_lang:
#             transcript_language = self.transcript_language
#         elif sub:
#             transcript_language = 'en'
#         elif len(other_lang) > 0:
#             transcript_language = sorted(other_lang)[0]
#         else:
#             transcript_language = 'en'
#         return transcript_language
#
#     def get_transcripts_info(self, is_bumper=False):
#         """
#         Returns a transcript dictionary for the video.
#
#         Arguments:
#             is_bumper(bool): If True, the request is for the bumper transcripts
#             include_val_transcripts(bool): If True, include edx-val transcripts as well
#         """
#         if is_bumper:
#             transcripts = copy.deepcopy(get_bumper_settings(self).get('transcripts', {}))
#             sub = transcripts.pop("en", "")
#         else:
#             transcripts = self.transcripts if self.transcripts else {}
#             sub = self.sub
#
#         # Only attach transcripts that are not empty.
#         transcripts = {
#             language_code: transcript_file
#             for language_code, transcript_file in transcripts.items() if transcript_file != ''
#         }
#
#         # bumper transcripts are stored in content store so we don't need to include val transcripts
#         if not is_bumper:
#             transcript_languages = get_available_transcript_languages(edx_video_id=self.edx_video_id)
#             # HACK Warning! this is temporary and will be removed once edx-val take over the
#             # transcript module and contentstore will only function as fallback until all the
#             # data is migrated to edx-val.
#             for language_code in transcript_languages:
#                 if language_code == 'en' and not sub:
#                     sub = NON_EXISTENT_TRANSCRIPT
#                 elif not transcripts.get(language_code):
#                     transcripts[language_code] = NON_EXISTENT_TRANSCRIPT
#
#         return {
#             "sub": sub,
#             "transcripts": transcripts,
#         }
#
#
# def save_subs_to_store(subs, subs_id, item, language='en'):
#     """
#     Save transcripts into `StaticContent`.
#
#     Args:
#     `subs_id`: str, subtitles id
#     `item`: video block instance
#     `language`: two chars str ('uk'), language of translation of transcripts
#
#     Returns: location of saved subtitles.
#     """
#     filedata = json.dumps(subs, indent=2).encode('utf-8')
#     filename = subs_filename(subs_id, language)
#     return save_to_store(filedata, filename, 'application/json', item.location)
#
#
# def generate_subs(speed, source_speed, source_subs):
#     """
#     Generate transcripts from one speed to another speed.
#
#     Args:
#     `speed`: float, for this speed subtitles will be generated,
#     `source_speed`: float, speed of source_subs
#     `source_subs`: dict, existing subtitles for speed `source_speed`.
#
#     Returns:
#     `subs`: dict, actual subtitles.
#     """
#     if speed == source_speed:
#         return source_subs
#
#     coefficient = 1.0 * speed / source_speed
#     subs = {
#         'start': [
#             int(round(timestamp * coefficient)) for
#             timestamp in source_subs['start']
#         ],
#         'end': [
#             int(round(timestamp * coefficient)) for
#             timestamp in source_subs['end']
#         ],
#         'text': source_subs['text']}
#     return subs
#
#
# def subs_filename(subs_id, lang='en'):
#     """
#     Generate proper filename for storage.
#     """
#     if lang == 'en':
#         return f'subs_{subs_id}.srt.sjson'
#     else:
#         return f'{lang}_subs_{subs_id}.srt.sjson'
#
#
# def save_to_store(content, name, mime_type, location):
#     """
#     Save named content to store by location.
#
#     Returns location of saved content.
#     """
#     content_location = Transcript.asset_location(location, name)
#     content = StaticContent(content_location, name, mime_type, content)
#     contentstore().save(content)
#     return content_location
#
#
# class Transcript:
#     """
#     Container for transcript methods.
#     """
#     SRT = 'srt'
#     TXT = 'txt'
#     SJSON = 'sjson'
#     mime_types = {
#         SRT: 'application/x-subrip; charset=utf-8',
#         TXT: 'text/plain; charset=utf-8',
#         SJSON: 'application/json',
#     }
#
#     @staticmethod
#     def convert(content, input_format, output_format):
#         """
#         Convert transcript `content` from `input_format` to `output_format`.
#
#         Accepted input formats: sjson, srt.
#         Accepted output format: srt, txt, sjson.
#
#         Raises:
#             TranscriptsGenerationException: On parsing the invalid srt content during conversion from srt to sjson.
#         """
#         assert input_format in ('srt', 'sjson')
#         assert output_format in ('txt', 'srt', 'sjson')
#
#         if input_format == output_format:
#             return content
#
#         if input_format == 'srt':
#             # Standardize content into bytes for later decoding.
#             if isinstance(content, str):
#                 content = content.encode('utf-8')
#
#             if output_format == 'txt':
#                 text = SubRipFile.from_string(content.decode('utf-8')).text
#                 return html.unescape(text)
#
#             elif output_format == 'sjson':
#                 try:
#                     srt_subs = SubRipFile.from_string(
#                         # Skip byte order mark(BOM) character
#                         content.decode('utf-8-sig'),
#                         error_handling=SubRipFile.ERROR_RAISE
#                     )
#                 except Error as ex:  # Base exception from pysrt
#                     raise TranscriptsGenerationException(str(ex)) from ex
#
#                 return json.dumps(generate_sjson_from_srt(srt_subs))
#
#         if input_format == 'sjson':
#             # If the JSON file content is bytes, try UTF-8, then Latin-1
#             if isinstance(content, bytes):
#                 try:
#                     content_str = content.decode('utf-8')
#                 except UnicodeDecodeError:
#                     content_str = content.decode('latin-1')
#             else:
#                 content_str = content
#             try:
#                 content_dict = json.loads(content_str)
#             except ValueError:
#                 truncated = content_str[:100].strip()
#                 log.exception(
#                     f"Failed to convert {input_format} to {output_format} for {repr(truncated)}..."
#                 )
#                 content_dict = {"start": [1], "end": [2], "text": ["An error occured obtaining the transcript."]}
#             if output_format == 'txt':
#                 text = content_dict['text']
#                 text_without_none = [line if line else '' for line in text]
#                 return html.unescape("\n".join(text_without_none))
#             elif output_format == 'srt':
#                 return generate_srt_from_sjson(content_dict, speed=1.0)
#
#     @staticmethod
#     def asset(location, subs_id, lang='en', filename=None):
#         """
#         Get asset from contentstore, asset location is built from subs_id and lang.
#
#         `location` is block location.
#         """
#         # HACK Warning! this is temporary and will be removed once edx-val take over the
#         # transcript module and contentstore will only function as fallback until all the
#         # data is migrated to edx-val. It will be saving a contentstore hit for a hardcoded
#         # dummy-non-existent-transcript name.
#         if NON_EXISTENT_TRANSCRIPT in [subs_id, filename]:
#             raise NotFoundError
#
#         asset_filename = subs_filename(subs_id, lang) if not filename else filename
#         return Transcript.get_asset(location, asset_filename)
#
#     @staticmethod
#     def get_asset(location, filename):
#         """
#         Return asset by location and filename.
#         """
#         return contentstore().find(Transcript.asset_location(location, filename))
#
#     @staticmethod
#     def asset_location(location, filename):
#         """
#         Return asset location. `location` is block location.
#         """
#         # If user transcript filename is empty, raise `TranscriptException` to avoid `InvalidKeyError`.
#         if not filename:
#             raise TranscriptException("Transcript not uploaded yet")
#         return StaticContent.compute_location(location.course_key, filename)
#
#     @staticmethod
#     def delete_asset(location, filename):
#         """
#         Delete asset by location and filename.
#         """
#         try:
#             contentstore().delete(Transcript.asset_location(location, filename))
#             log.info("Transcript asset %s was removed from store.", filename)
#         except NotFoundError:
#             pass
#         return StaticContent.compute_location(location.course_key, filename)
#
#
# def generate_srt_from_sjson(sjson_subs, speed):
#     """Generate transcripts with speed = 1.0 from sjson to SubRip (*.srt).
#
#     :param sjson_subs: "sjson" subs.
#     :param speed: speed of `sjson_subs`.
#     :returns: "srt" subs.
#     """
#
#     output = ''
#
#     equal_len = len(sjson_subs['start']) == len(sjson_subs['end']) == len(sjson_subs['text'])
#     if not equal_len:
#         return output
#
#     sjson_speed_1 = generate_subs(speed, 1, sjson_subs)
#
#     for i in range(len(sjson_speed_1['start'])):
#         item = SubRipItem(
#             index=i,
#             start=SubRipTime(milliseconds=sjson_speed_1['start'][i]),
#             end=SubRipTime(milliseconds=sjson_speed_1['end'][i]),
#             text=sjson_speed_1['text'][i]
#         )
#         output += (str(item))
#         output += '\n'
#     return output
#
# def generate_sjson_from_srt(srt_subs):
#     """
#     Generate transcripts from sjson to SubRip (*.srt).
#
#     Arguments:
#         srt_subs(SubRip): "SRT" subs object
#
#     Returns:
#         Subs converted to "SJSON" format.
#     """
#     sub_starts = []
#     sub_ends = []
#     sub_texts = []
#     for sub in srt_subs:
#         sub_starts.append(sub.start.ordinal)
#         sub_ends.append(sub.end.ordinal)
#         sub_texts.append(sub.text.replace('\n', ' '))
#
#     sjson_subs = {
#         'start': sub_starts,
#         'end': sub_ends,
#         'text': sub_texts
#     }
#     return sjson_subs
