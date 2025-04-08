"""TO-DO: Write a description of what this XBlock is."""

import copy
import json
import logging
import html
from collections import OrderedDict
from importlib.resources import files

import markupsafe
from django.utils import translation
from lxml import etree
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Boolean, Dict, List, Scope, String, ScopeIds
from xblock.utils.resources import ResourceLoader

def _(text):
    return text

Text = markupsafe.escape
resource_loader = ResourceLoader(__name__)
log = logging.getLogger(__name__)

# assume all XML files are persisted as utf-8.
EDX_XML_PARSER = etree.XMLParser(dtd_validation=False, load_dtd=False, remove_blank_text=True, encoding='utf-8')


@XBlock.needs("i18n")
class PollBlock(XBlock):
    """Poll Block"""

    display_name = String(
        help=_("The display name for this component."),
        scope=Scope.settings,
        default='poll_extracted'
    )

    voted = Boolean(
        help=_("Whether this student has voted on the poll"),
        scope=Scope.user_state,
        default=False
    )

    poll_answer = String(
        help=_("Student answer"),
        scope=Scope.user_state,
        default=''
    )

    poll_answers = Dict(
        help=_("Poll answers from all students"),
        scope=Scope.user_state_summary
    )

    # List of answers, in the form {'id': 'some id', 'text': 'the answer text'}
    answers = List(
        help=_("Poll answers from xml"),
        scope=Scope.content,
        default=[]
    )

    question = String(
        help=_("Poll question"),
        scope=Scope.content,
        default=''
    )

    # Indicates that this XBlock has been extracted from edx-platform.
    is_extracted = True

    # Extension to append to filename paths
    filename_extension = 'xml'

    xml_attributes = Dict(help="Map of unhandled xml attributes, used only for storage between import and export",
                          default={}, scope=Scope.settings)

    metadata_to_strip = ('data_dir',
                         'tabs', 'grading_policy',
                         'discussion_blackouts',
                         # VS[compat]
                         # These attributes should have been removed from here once all 2012-fall courses imported into
                         # the CMS and "inline" OLX format deprecated. But, it never got deprecated. Moreover, it's
                         # widely used to this date. So, we still have to strip them. Also, removing of "filename"
                         # changes OLX returned by `/api/olx-export/v1/xblock/{block_id}/`, which indicates that some
                         # places in the platform rely on it.
                         'course', 'org', 'url_name', 'filename',
                         # Used for storing xml attributes between import and export, for roundtrips
                         'xml_attributes',
                         # Used by _import_xml_node_to_parent in cms/djangoapps/contentstore/helpers.py to prevent
                         # XmlMixin from treating some XML nodes as "pointer nodes".
                         "x-is-pointer-node",
                         )

    # Optionally, define a class attribute 'fields' so references to it do not raise errors.
    fields = {}

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        return files(__package__).joinpath(path).read_text(encoding="utf-8")

    def student_view(self, _context):
        """
        Renders the student view.
        """
        frag = Fragment()
        frag.add_content(resource_loader.render_django_template(
            "templates/poll.html", {
                'element_id': self.scope_ids.usage_id.html_id(),
                'element_class': self.scope_ids.usage_id.block_type,
                'configuration_json': self.dump_poll(),
            },
            i18n_service=self.runtime.service(self, 'i18n')
        ))
        frag.add_css(resource_loader.load_unicode("static/css/poll.css"))
        frag.add_javascript(resource_loader.load_unicode("static/js/src/poll.js"))
        frag.initialize_js('PollBlock')
        return frag

    def dump_poll(self):
        """Dump poll information.

        Returns:
            string - Serialize json.
        """
        # FIXME: hack for resolving caching `default={}` during definition
        # poll_answers field
        if self.poll_answers is None:
            self.poll_answers = {}

        answers_to_json = OrderedDict()

        # # # FIXME: fix this, when xblock support mutable types.
        # # # Now we use this hack.
        temp_poll_answers = self.poll_answers

        # # # Fill self.poll_answers, prepare data for template context.
        for answer in self.answers:
            # Set default count for answer = 0.
            if answer['id'] not in temp_poll_answers:
                temp_poll_answers[answer['id']] = 0
            answers_to_json[answer['id']] = html.escape(answer['text'], quote=False)
        self.poll_answers = temp_poll_answers

        return json.dumps({
            'answers': answers_to_json,                
            'question': self.question,
            'poll_answer': self.poll_answer,
            'poll_answers': self.poll_answers,
            'total': sum(self.poll_answers.values()) if self.voted else 0,
            'reset': str(self.xml_attributes.get('reset', 'true')).lower()
        })

    # TO-DO: change this handler to perform your own actions.  You may need more
    # than one handler, or you may not need any handlers at all.

    @XBlock.json_handler
    def handle_get_state(self, data, suffix=''):  # lint-amnesty, pylint: disable=unused-argument
        return {
            'poll_answer': self.poll_answer,
            'poll_answers': self.poll_answers,
            'total': sum(self.poll_answers.values())
        }

    @XBlock.json_handler
    def handle_submit_state(self, data, suffix=''):  # lint-amnesty, pylint: disable=unused-argument
        """
        handler to submit poll answer.
        """
        answer = data.get('answer')  # Extract the answer from the data payload
        if not answer:
            return {'error': 'No answer provided!'}

        if answer in self.poll_answers and not self.voted:
            # FIXME: fix this, when xblock will support mutable types.
            # Now we use this hack.
            temp_poll_answers = self.poll_answers
            temp_poll_answers[answer] += 1
            self.poll_answers = temp_poll_answers

            self.voted = True
            self.poll_answer = answer
            return {
                'poll_answers': self.poll_answers,
                'total': sum(self.poll_answers.values()),
                'callback': {'objectName': 'Conditional'}
            }
        return {"error": "Invalid answer or already voted."}

    @XBlock.json_handler
    def handle_reset_state(self):
        """
        handler to reset poll answer.
        """
        self.voted = False

        # FIXME: fix this, when xblock will support mutable types.
        # Now we use this hack.
        temp_poll_answers = self.poll_answers
        temp_poll_answers[self.poll_answer] -= 1
        self.poll_answers = temp_poll_answers
        self.poll_answer = ''
        return {'status': 'success'}

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """Create canned scenario for display in the workbench."""
        return [
            (
                "PollBlock",
                """<_poll_question_extracted/>
                """,
            ),
            (
                "Multiple PollBlock",
                """<vertical_demo>
                <_poll_question_extracted/>
                <_poll_question_extracted/>
                <_poll_question_extracted/>
                </vertical_demo>
                """,
            ),
        ]

    @staticmethod
    def get_dummy():
        """
        Generate initial i18n with dummy method.
        """
        return translation.gettext_noop("Dummy")

    @classmethod
    def stringify_children(cls, node):
        """
        Return all contents of an XML tree, without the outer tags.
        ...
        """
        parts = [node.text]
        for c in node.getchildren():
            parts.append(etree.tostring(c, with_tail=True, encoding='unicode'))
        return ''.join(part for part in parts if part)

    _tag_name = 'poll_question'
    _child_tag_name = 'answer'

    def HTML(self, html_content):  # pylint: disable=invalid-name
        """
        Mark a string as already HTML, so that it won't be escaped before output.
        """
        return markupsafe.Markup(html_content)

    @classmethod
    def deserialize_field(cls, field, value):
        """
        Deserialize the string version to the value stored internally.
        """
        try:
            deserialized = json.loads(value)
            if deserialized is None:
                return deserialized
            try:
                field.from_json(deserialized)
                return deserialized
            except (ValueError, TypeError):
                return value
        except (ValueError, TypeError):
            return value

    # Change name_to_pathname to a static method.
    @staticmethod
    def name_to_pathname(name):
        """
        Convert a location name for use in a path: replace ':' with '/'.
        """
        return name.replace(':', '/')


    @classmethod
    def file_to_xml(cls, file_object):
        """
        Used when this module wants to parse a file object to xml
        that will be converted to the definition.

        Returns an lxml Element
        """
        return etree.parse(file_object, parser=EDX_XML_PARSER).getroot()


    @classmethod
    @classmethod
    def load_file(cls, filepath, fs, def_id):  # pylint: disable=invalid-name
        """
        Open the specified file in fs, and call cls.file_to_xml on it.
        """
        try:
            with fs.open(filepath) as xml_file:
                return cls.file_to_xml(xml_file)
        except (OSError, etree.XMLSyntaxError) as err:
            raise Exception(f'Unable to load file contents at path {filepath} for item {def_id}: {err}') from err

    @classmethod
    def _format_filepath(cls, category, name):
        return f'{category}/{name}.{cls.filename_extension}'

    @classmethod
    def apply_policy(cls, metadata, policy):
        """
        Add the keys in policy to metadata.
        """
        for attr, value in policy.items():
            if attr not in getattr(cls, "fields", {}):
                metadata['xml_attributes'][attr] = value
            else:
                metadata[attr] = value

    @staticmethod
    def is_pointer_tag(xml_obj):
        """
        Check if xml_obj is a pointer tag.
        """
        if xml_obj.tag != "course":     # pylint: disable=comparison-with-callable
            expected_attr = {'url_name'}
        else:
            expected_attr = {'url_name', 'course', 'org'}

        actual_attr = set(xml_obj.attrib.keys())
        has_text = bool(xml_obj.text and xml_obj.text.strip())
        return len(xml_obj) == 0 and actual_attr == expected_attr and not has_text

    # Rename parameter to "xml_obj" for consistency.
    @classmethod
    def _get_metadata_from_xml(cls, xml_obj, remove=True):
        """
        Extract the metadata from the XML.
        """
        meta = xml_obj.find('meta')
        if meta is None:
            return ''
        dmdata = meta.text
        if remove:
            xml_obj.remove(meta)
        return dmdata

    @classmethod
    def load_metadata(cls, xml_object):
        """
        Read the metadata attributes from xml_object.
        """
        metadata = {'xml_attributes': {}}
        for attr, val in xml_object.attrib.items():
            if attr in cls.metadata_to_strip:
                continue
            if attr not in getattr(cls, "fields", {}):
                metadata['xml_attributes'][attr] = val
            else:
                metadata[attr] = cls.deserialize_field(getattr(cls, "fields", {})[attr], val)
        return metadata

    # Rename parameter to "xml_obj" for consistency.
    @classmethod
    def clean_metadata_from_xml(cls, xml_obj, excluded_fields=()):
        """
        Remove any attribute named for a field with scope Scope.settings.
        """
        for field_name, field in getattr(cls, "fields", {}).items():
            if (field.scope == Scope.settings
                    and field_name not in excluded_fields
                    and xml_obj.get(field_name) is not None):
                del xml_obj.attrib[field_name]

    @classmethod
    def parse_xml(cls, node, runtime, keys):
        """
        Use `node` to construct a new block.
        """
        if keys is None:
            def_id = runtime.id_generator.create_definition(node.tag, node.get('url_name'))
            keys = ScopeIds(None, node.tag, def_id, runtime.id_generator.create_usage(def_id))
        aside_children = []
        if cls.is_pointer_tag(node):
            definition_xml, filepath = cls.load_definition_xml(node, runtime, keys.def_id)
            aside_children = runtime.parse_asides(definition_xml, keys.def_id, keys.usage_id, runtime.id_generator)
        else:
            filepath = None
            definition_xml = node

        definition, children = cls.load_definition(definition_xml, runtime, keys.def_id, runtime.id_generator)

        if cls.is_pointer_tag(node):
            definition['filename'] = [filepath, filepath]

        metadata = cls.load_metadata(definition_xml)
        dmdata = definition.get('definition_metadata', '')
        if dmdata:
            metadata['definition_metadata_raw'] = dmdata
            try:
                metadata.update(json.loads(dmdata))
            except (ValueError, TypeError) as err:
                log.debug('Error in loading metadata %r', dmdata, exc_info=True)
                metadata['definition_metadata_err'] = str(err)

        definition_aside_children = definition.pop('aside_children', None)
        if definition_aside_children:
            aside_children.extend(definition_aside_children)

        cls.apply_policy(metadata, runtime.get_policy(keys.usage_id))
        field_data = {**metadata, **definition, "children": children}
        field_data['xml_attributes']['filename'] = definition.get('filename', ['', None])
        if "filename" in field_data:
            del field_data["filename"]

        xblock = runtime.construct_xblock_from_class(cls, keys)
        for (key, value_jsonish) in field_data.items():
            if key in getattr(cls, "fields", {}):
                setattr(xblock, key, getattr(cls, "fields", {})[key].from_json(value_jsonish))
            elif key == 'children':
                xblock.children = value_jsonish
            else:
                log.warning(
                    "Imported %s XBlock does not have field %s found in XML.", xblock.scope_ids.block_type, key,
                )

        if aside_children:
            asides_tags = [x.tag for x in aside_children]
            asides = runtime.get_asides(xblock)
            for asd in asides:
                if asd.scope_ids.block_type in asides_tags:
                    xblock.add_aside(asd)

        return xblock

    @classmethod
    def load_definition(cls, xml_object, system, def_id, id_generator):
        """
        Load a block from the specified xml_object.
        """
        filename = xml_object.get('filename')
        if filename is None:
            definition_xml = copy.deepcopy(xml_object)
            filepath = ''
            aside_children = []
        else:
            filepath = PollBlock._format_filepath(xml_object.tag, filename)
            if not system.resources_fs.exists(filepath) and hasattr(cls, 'backcompat_paths'):
                candidates = cls.backcompat_paths(filepath)
                for candidate in candidates:
                    if system.resources_fs.exists(candidate):
                        filepath = candidate
                        break
            definition_xml = cls.load_file(filepath, system.resources_fs, def_id)
            usage_id = id_generator.create_usage(def_id)
            aside_children = system.parse_asides(definition_xml, def_id, usage_id, id_generator)
            definition_xml.attrib.update(xml_object.attrib)

        definition_metadata = cls._get_metadata_from_xml(definition_xml)
        cls.clean_metadata_from_xml(definition_xml)
        definition, children = cls.definition_from_xml(definition_xml)
        if definition_metadata:
            definition['definition_metadata'] = definition_metadata
        definition['filename'] = [filepath, filename]
        if aside_children:
            definition['aside_children'] = aside_children
        return definition, children

    @classmethod
    def load_definition_xml(cls, node, runtime, def_id):
        """
        Loads definition_xml stored in a dedicated file.
        """
        url_name = node.get('url_name')
        filepath = PollBlock._format_filepath(node.tag, cls.name_to_pathname(url_name))
        definition_xml = cls.load_file(filepath, runtime.resources_fs, def_id)
        return definition_xml, filepath

    @classmethod
    def definition_from_xml(cls, xml_object):
        """
        Extract data from an XML object into a dictionary.
        """
        if len(xml_object.xpath(cls._child_tag_name)) == 0:
            raise ValueError(
                "Poll_question definition must include at least one 'answer' tag"
            )
        xml_object_copy = copy.deepcopy(xml_object)
        answers = []
        for element_answer in xml_object_copy.findall(cls._child_tag_name):
            answer_id = element_answer.get("id", None)
            if answer_id:
                answers.append(
                    {
                        "id": answer_id,
                        "text": cls.stringify_children(element_answer),
                    }
                )
            xml_object_copy.remove(element_answer)
        definition = {
            "answers": answers,
            "question": cls.stringify_children(xml_object_copy),
        }
        children = []
        return definition, children

    def definition_to_xml(self):
        """Return an xml element representing to this definition."""
        poll_str = self.HTML('<{tag_name}>{text}</{tag_name}>').format(
            tag_name=self._tag_name, text=self.question)
        xml_object = etree.fromstring(poll_str)
        xml_object.set('display_name', self.display_name)

        def add_child(answer):
            answer_text = str(answer['text'])
            child_str = Text('{tag_begin}{text}{tag_end}').format(
                tag_begin=self.HTML('<{tag_name} id="{id}">').format(
                    tag_name=self._child_tag_name,
                    id=answer['id']
                ),
                text=answer_text,
                tag_end=self.HTML('</{tag_name}>').format(tag_name=self._child_tag_name)
            )
            child_node = etree.fromstring(child_str)
            xml_object.append(child_node)

        for answer in self.answers:
            add_child(answer)
        return xml_object

    # Added backcompat_paths to satisfy pylint.
    @classmethod
    def backcompat_paths(cls):
        return []
    