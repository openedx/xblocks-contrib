"""Word cloud is ungraded xblock used by students to
generate and view word cloud.

On the client side we show:
If student does not yet answered - `num_inputs` numbers of text inputs.
If student have answered - words he entered and cloud.
"""
import copy
import json
import logging
import os
import uuid

from django.utils.translation import gettext_noop as _
from lxml import etree
from lxml.etree import ElementTree
from web_fragments.fragment import Fragment
from xblock.core import XML_NAMESPACES, XBlock
from xblock.fields import Boolean, Dict, Integer, List, Scope, ScopeIds, String
from xblock.utils.resources import ResourceLoader
from xblock.utils.studio_editable import StudioEditableXBlockMixin

from xblocks_contrib.common.xml_utils import (
    apply_pointer_attributes,
    deserialize_field,
    format_filepath,
    is_pointer_tag,
    load_definition_xml,
    name_to_pathname,
    own_metadata,
    serialize_field,
)

log = logging.getLogger(__name__)
resource_loader = ResourceLoader(__name__)


def pretty_bool(value):
    """Check value for possible `True` value.

    Using this function we can manage different type of Boolean value
    in xml files.
    """
    bool_dict = [True, "True", "true", "T", "t", "1"]
    return value in bool_dict


class WordCloudXmlMixin:
    """
    A mixin class to add XML parsing functionality to WordCloud.
    """

    metadata_to_strip = (
        'data_dir',
        'tabs',
        'grading_policy',
        'discussion_blackouts',
        'course',
        'org',
        'url_name',
        'filename',
        'xml_attributes',
        "x-is-pointer-node",
    )

    xml_attributes = Dict(
        help="Map of unhandled xml attributes, used only for storage between import and export",
        default={},
        scope=Scope.settings
    )

    @classmethod
    def apply_policy(cls, metadata, policy):
        """
        Add the keys in policy to metadata, after processing them
        through the attrmap.  Updates the metadata dict in place.
        """
        for attr, value in policy.items():
            if attr not in cls.fields:
                # Store unknown attributes coming from policy.json
                # in such a way that they will export to xml unchanged
                metadata['xml_attributes'][attr] = value
            else:
                metadata[attr] = value

    @staticmethod
    def _get_metadata_from_xml(xml_object, remove=True):
        """
        Extract the metadata from the XML.
        """
        meta = xml_object.find('meta')
        if meta is None:
            return ''
        dmdata = meta.text
        if remove:
            xml_object.remove(meta)
        return dmdata

    @classmethod
    def clean_metadata_from_xml(cls, xml_object, excluded_fields=()):
        """
        Remove any attribute named for a field with scope Scope.settings from the supplied
        xml_object
        """
        for field_name, field in cls.fields.items():
            if (field.scope == Scope.settings
                    and field_name not in excluded_fields
                    and xml_object.get(field_name) is not None):
                del xml_object.attrib[field_name]

    @classmethod
    def load_definition(cls, xml_object):
        """
        Load a block from the specified xml_object.

        Args:
            xml_object: an lxml.etree._Element containing the definition to load
        """

        filename = xml_object.get('filename')
        definition_xml = copy.deepcopy(xml_object)
        filepath = ''

        definition_metadata = cls._get_metadata_from_xml(definition_xml)
        cls.clean_metadata_from_xml(definition_xml)

        if len(xml_object) == 0 and len(list(xml_object.items())) == 0:
            definition, children = {'data': ''}, []
        else:
            definition, children = {'data': etree.tostring(xml_object, pretty_print=True, encoding='unicode')}, []

        if definition_metadata:
            definition['definition_metadata'] = definition_metadata
        definition['filename'] = [filepath, filename]

        return definition, children

    @classmethod
    def load_metadata(cls, xml_object):
        """
        Read the metadata attributes from this xml_object.

        Returns a dictionary {key: value}.
        """
        metadata = {'xml_attributes': {}}
        for attr, val in xml_object.attrib.items():

            if attr in cls.metadata_to_strip:
                # don't load these
                continue

            if attr not in cls.fields:
                metadata['xml_attributes'][attr] = val
            else:
                metadata[attr] = deserialize_field(cls.fields[attr], val)
        return metadata

    @classmethod
    def parse_xml(cls, node, runtime, keys):
        """
        Use `node` to construct a new block.

        Arguments:
            node (etree.Element): The xml node to parse into an xblock.

            runtime (:class:`.Runtime`): The runtime to use while parsing.

            keys (:class:`.ScopeIds`): The keys identifying where this block
                will store its data.

        Returns (XBlock): The newly parsed XBlock

        """
        if keys is None:
            # Passing keys=None is against the XBlock API but some platform tests do it.
            def_id = runtime.id_generator.create_definition(node.tag, node.get("url_name"))
            keys = ScopeIds(None, node.tag, def_id, runtime.id_generator.create_usage(def_id))
        aside_children = []

        # Let the runtime construct the block. It will have a proper, inheritance-aware field data store.
        block = runtime.construct_xblock_from_class(cls, keys)

        # VS[compat]
        # In 2012, when the platform didn't have CMS, and all courses were handwritten XML files, problem tags
        # contained XML problem descriptions withing themselves. Later, when Studio has been created, and "pointer" tags
        # became the preferred problem format, edX has to add this compatibility code to 1) support both pre- and
        # post-Studio course formats simulteneously, and 2) be able to migrate 2012-fall courses to Studio. Old style
        # support supposed to be removed, but the deprecation process have never been initiated, so this
        # compatibility must stay, probably forever.
        if is_pointer_tag(node):
            # new style:
            # read the actual definition file--named using url_name.replace(':','/')
            definition_xml, filepath = load_definition_xml(node, runtime, keys.def_id)
            aside_children = runtime.parse_asides(definition_xml, keys.def_id, keys.usage_id, runtime.id_generator)
        else:
            filepath = None
            definition_xml = node

        # Removes metadata
        definition, children = cls.load_definition(definition_xml)

        # VS[compat]
        # Make Ike's github preview links work in both old and new file layouts.
        if is_pointer_tag(node):
            # new style -- contents actually at filepath
            definition["filename"] = [filepath, filepath]

        metadata = cls.load_metadata(definition_xml)

        # move definition metadata into dict
        dmdata = definition.get("definition_metadata", "")
        if dmdata:
            metadata["definition_metadata_raw"] = dmdata
            try:
                metadata.update(json.loads(dmdata))
            except Exception as err:  # lint-amnesty, pylint: disable=broad-except
                log.debug("Error in loading metadata %r", dmdata, exc_info=True)
                metadata["definition_metadata_err"] = str(err)

        definition_aside_children = definition.pop("aside_children", None)
        if definition_aside_children:
            aside_children.extend(definition_aside_children)

        # Set/override any metadata specified by policy
        cls.apply_policy(metadata, runtime.get_policy(keys.usage_id))

        field_data = {**metadata, **definition}

        for field_name, value in field_data.items():
            # The 'xml_attributes' field has a special setter logic in its Field class,
            # so we must handle it carefully to avoid duplicating data.
            if field_name == "xml_attributes":
                # The 'filename' attribute is specially handled for git links.
                value["filename"] = definition.get("filename", ["", None])
                block.xml_attributes.update(value)
            elif field_name in block.fields:
                setattr(block, field_name, value)

        block.children = children

        if aside_children:
            cls.add_applicable_asides_to_block(block, runtime, aside_children)

        return block

    @classmethod
    def add_applicable_asides_to_block(cls, block, runtime, aside_children):
        """
        Add asides to the block. Moved this out of the parse_xml method to use it in the VideoBlock.parse_xml
        """
        asides_tags = [aside_child.tag for aside_child in aside_children]
        asides = runtime.get_asides(block)
        for aside in asides:
            if aside.scope_ids.block_type in asides_tags:
                block.add_aside(aside)

    def export_to_file(self):
        """If this returns True, write the definition of this block to a separate
        file.
        """
        return True

    def add_xml_to_node(self, node):
        """For exporting, set data on `node` from ourselves."""
        xml_object = etree.Element(self.category)

        if xml_object is None:
            return

        for aside in self.runtime.get_asides(self):
            if aside.needs_serialization():
                aside_node = etree.Element("unknown_root", nsmap=XML_NAMESPACES)
                aside.add_xml_to_node(aside_node)
                xml_object.append(aside_node)

        self.clean_metadata_from_xml(xml_object)
        xml_object.tag = self.category
        node.tag = self.category

        for attr in sorted(own_metadata(self)):
            if attr not in self.metadata_to_strip:
                # pylint: disable=unsubscriptable-object
                val = serialize_field(self.fields[attr].to_json(getattr(self, attr)))
                try:
                    xml_object.set(attr, val)
                except Exception:  # pylint: disable=broad-exception-caught
                    logging.exception("Failed to serialize metadata attribute %s in module %s.", attr, self.url_name)

        for key, value in self.xml_attributes.items():
            if key not in self.metadata_to_strip:
                xml_object.set(key, serialize_field(value))

        if self.export_to_file():
            url_path = name_to_pathname(self.url_name)
            filepath = format_filepath(self.category, url_path)
            self.runtime.export_fs.makedirs(os.path.dirname(filepath), recreate=True)
            with self.runtime.export_fs.open(filepath, "wb") as fileobj:
                ElementTree(xml_object).write(fileobj, pretty_print=True, encoding="utf-8")
        else:
            node.clear()
            node.tag = xml_object.tag
            node.text = xml_object.text
            node.tail = xml_object.tail
            node.attrib.update(xml_object.attrib)
            node.extend(xml_object)

        apply_pointer_attributes(node, self)


@XBlock.needs("i18n")
class WordCloudBlock(StudioEditableXBlockMixin, WordCloudXmlMixin, XBlock):
    """
    Word Cloud XBlock.
    """

    # Indicates that this XBlock has been extracted from edx-platform.
    is_extracted = True
    # "data" class attribute is added to make the following test case pass in edx-platform repo.
    # cms/djangoapps/contentstore/tests/test_contentstore.py::ImportRequiredTestCases::test_empty_data_roundtrip
    data = String(default='', scope=Scope.content)

    editable_fields = ["display_name", "num_inputs", "instructions", "num_top_words", "display_student_percents"]

    display_name = String(
        display_name=_("Display Name"),
        help=_("The display name for this component."),
        scope=Scope.settings,
        default="Word cloud"
    )
    instructions = String(
        display_name=_("Instructions"),
        help=_(
            "Add instructions to help learners understand how to use the word cloud. Clear instructions are "
            "important, especially for learners who have accessibility requirements."),
        scope=Scope.settings,
    )
    num_inputs = Integer(
        display_name=_("Inputs"),
        help=_("The number of text boxes available for learners to add words and sentences."),
        scope=Scope.settings,
        default=5,
        values={"min": 1}
    )
    num_top_words = Integer(
        display_name=_("Maximum Words"),
        help=_("The maximum number of words displayed in the generated word cloud."),
        scope=Scope.settings,
        default=250,
        values={"min": 1}
    )
    display_student_percents = Boolean(
        display_name=_("Show Percents"),
        help=_("Statistics are shown for entered words near that word."),
        scope=Scope.settings,
        default=True
    )

    # Fields for descriptor.
    submitted = Boolean(
        help=_("Whether this learner has posted words to the cloud."),
        scope=Scope.user_state,
        default=False
    )
    student_words = List(
        help=_("Student answer."),
        scope=Scope.user_state,
        default=[]
    )
    all_words = Dict(
        help=_("All possible words from all learners."),
        scope=Scope.user_state_summary
    )
    top_words = Dict(
        help=_("Top num_top_words words for word cloud."),
        scope=Scope.user_state_summary
    )

    @staticmethod
    def workbench_scenarios():
        """Create canned scenario for display in the workbench."""
        return [
            (
                "WordCloudBlock",
                """<_word_cloud_extracted/>
                """,
            ),
            (
                "Multiple WordCloudBlock",
                """<vertical_demo>
                <_word_cloud_extracted/>
                <_word_cloud_extracted/>
                <_word_cloud_extracted/>
                </vertical_demo>
                """,
            ),
        ]

    def student_view(self, context=None):  # pylint: disable=W0613
        """
        Create primary view of the WordCloudXBlock, shown to students when viewing courses.
        """
        frag = Fragment()
        frag.add_content(resource_loader.render_django_template(
            "templates/word_cloud.html", {
                'display_name': self.display_name,
                'instructions': self.instructions,
                'element_class': self.scope_ids.block_type,
                'element_id': uuid.uuid1(0),
                'num_inputs': self.num_inputs,
                'range_num_inputs': range(self.num_inputs),
                'submitted': self.submitted,
            },
            i18n_service=self.runtime.service(self, 'i18n')
        ))
        frag.add_css(resource_loader.load_unicode("static/css/word_cloud.css"))
        frag.add_javascript(resource_loader.load_unicode("static/js/src/word_cloud.js"))
        frag.add_javascript(resource_loader.load_unicode("static/js/src/d3.min.js"))
        frag.add_javascript(resource_loader.load_unicode("static/js/src/d3.layout.cloud.js"))
        frag.add_javascript(resource_loader.load_unicode("static/js/src/html_utils.js"))
        frag.initialize_js('WordCloudBlock')
        return frag

    def good_word(self, word):
        """Convert raw word to suitable word."""
        return word.strip().lower()

    def top_dict(self, dict_obj, amount):
        """Return top words from all words, filtered by number of
        occurences

        :param dict_obj: all words
        :type dict_obj: dict
        :param amount: number of words to be in top dict
        :type amount: int
        :rtype: dict
        """
        return dict(
            sorted(
                list(dict_obj.items()),
                key=lambda x: x[1],
                reverse=True
            )[:amount]
        )

    def get_state(self):
        """Return success json answer for client."""
        if self.submitted:
            total_count = sum(self.all_words.values())
            return {
                'status': 'success',
                'submitted': True,
                'display_student_percents': pretty_bool(
                    self.display_student_percents
                ),
                'student_words': {
                    word: self.all_words[word] for word in self.student_words
                },
                'total_count': total_count,
                'top_words': self.prepare_words(self.top_words, total_count),
            }
        else:
            return {
                'status': 'success',
                'submitted': False,
                'display_student_percents': False,
                'student_words': {},
                'total_count': 0,
                'top_words': {}
            }

    @XBlock.json_handler
    def handle_get_state(self, data, suffix=''):  # pylint: disable=unused-argument
        """
        AJAX handler to get the current state of the XBlock

        Args:
            data: dict having request get parameters

        Returns:
            json string
        """
        return self.get_state()

    @XBlock.json_handler
    def handle_submit_state(self, data, suffix=''):  # pylint: disable=unused-argument
        return self.submit_state(data)

    def submit_state(self, data, suffix=''):  # pylint: disable=unused-argument
        """
        AJAX handler to submit the current state of the XBlock

        Args:
            data: dict having request get parameters

        Returns:
            json string
        """

        if self.submitted:
            return {
                'status': 'fail',
                'error': 'You have already posted your data.'
            }

        # Student words from client.
        # FIXME: we must use raw JSON, not a post data (multipart/form-data)
        raw_student_words = data.get('student_words')
        student_words = [word for word in map(self.good_word, raw_student_words) if word]

        self.student_words = student_words

        # FIXME: fix this, when xblock will support mutable types.
        # Now we use this hack.
        # speed issues
        temp_all_words = self.all_words

        self.submitted = True

        # Save in all_words.
        for word in self.student_words:
            temp_all_words[word] = temp_all_words.get(word, 0) + 1

        # Update top_words.
        self.top_words = self.top_dict(
            temp_all_words,
            self.num_top_words
        )

        # Save all_words in database.
        self.all_words = temp_all_words

        return self.get_state()

    def prepare_words(self, top_words, total_count):
        """Convert words dictionary for client API.

        :param top_words: Top words dictionary
        :type top_words: dict
        :param total_count: Total number of words
        :type total_count: int
        :rtype: list of dicts. Every dict is 3 keys: text - actual word,
            size - counter of word, percent - percent in top_words dataset.

        Calculates corrected percents for every top word:

        For every word except last, it calculates rounded percent.
        For the last is 100 - sum of all other percents.

        """
        list_to_return = []
        percents = 0
        sorted_top_words = sorted(top_words.items(), key=lambda x: x[0].lower())
        for num, word_tuple in enumerate(sorted_top_words):
            if num == len(top_words) - 1:
                percent = 100 - percents
            else:
                percent = round((100.0 * word_tuple[1]) / total_count)
                percents += percent
            list_to_return.append(
                {
                    'text': word_tuple[0],
                    'size': word_tuple[1],
                    'percent': percent
                }
            )
        return list_to_return

    def index_dictionary(self):
        """
        Return dictionary prepared with block content and type for indexing.
        """
        # return key/value fields in a Python dict object
        # values may be numeric / string or dict
        # default implementation is an empty dict

        xblock_body = super().index_dictionary()

        index_body = {
            "display_name": self.display_name,
            "instructions": self.instructions,
        }

        if "content" in xblock_body:
            xblock_body["content"].update(index_body)
        else:
            xblock_body["content"] = index_body

        xblock_body["content_type"] = "Word Cloud"

        return xblock_body
