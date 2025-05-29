"""
Miscellaneous utility functions.
"""

import logging
import os
import re
from html.parser import HTMLParser
from importlib import resources

import yaml
from django.conf import settings
from lxml import etree

log = logging.getLogger(__name__)


class MLStripper(HTMLParser):
    """helper function for html_to_text below."""

    def __init__(self):
        """Initialize HTML parser and data collector."""
        HTMLParser.__init__(self)
        self.reset()
        self.fed = []

    def handle_starttag(self, tag, attrs):
        """Handle the start tag and extract 'alt' text from <img> tags."""
        if tag != "img":
            return
        for attr in attrs:
            if len(attr) >= 2 and attr[0] == "alt":
                self.fed.append(attr[1])

    def handle_data(self, data):
        """Take the data in separate chunks."""
        self.fed.append(data)

    def handle_entityref(self, name):
        """Append the reference to the body."""
        self.fed.append("&%s;" % name)

    def get_data(self):
        """Join together the seperate chunks into one cohesive string."""
        return "".join(self.fed)


def html_to_text(html):
    """Strip the html tags off of the text to return plaintext."""
    htmlstripper = MLStripper()
    htmlstripper.feed(html)
    return htmlstripper.get_data()


def escape_html_characters(content):
    """
    Remove HTML characters that shouldn't be indexed using ElasticSearch indexer.

    This method is complementary to html_to_text method found in xmodule/annotator_mixin.py

    Args:
        content (str): variable to escape html characters from
    Returns:
        content (str): content ready to be index by ElasticSearch
    """
    # Removing HTML comments
    return re.sub(
        r"<!--.*-->",
        "",
        # Removing HTML CDATA
        re.sub(
            r"<!\[CDATA\[.*\]\]>",
            "",
            # Removing HTML-encoded non-breaking space characters
            re.sub(r"(\s|&nbsp;|//)+", " ", html_to_text(content)),
        ),
    )


def check_html(html):
    """
    Check whether the passed in html string can be parsed by lxml.
    Return bool success.
    """
    parser = etree.HTMLParser()
    try:
        etree.fromstring(html, parser)
        return True
    except Exception:  # pylint: disable=broad-except
        pass
    return False


def stringify_children(node):
    """
    Return all contents of an xml tree, without the outside tags.
    e.g. if node is parse of
        "<html a="b" foo="bar">Hi <div>there <span>Bruce</span><b>!</b></div><html>"
    should return
        "Hi <div>there <span>Bruce</span><b>!</b></div>"

    fixed from
    http://stackoverflow.com/questions/4624062/get-all-text-inside-a-tag-in-lxml
    """
    # Useful things to know:

    # node.tostring() -- generates xml for the node, including start
    #                 and end tags.  We'll use this for the children.
    # node.text -- the text after the end of a start tag to the start
    #                 of the first child
    # node.tail -- the text after the end this tag to the start of the
    #                 next element.
    parts = [node.text]
    for c in node.getchildren():
        parts.append(etree.tostring(c, with_tail=True, encoding="unicode"))

    # filter removes possible Nones in texts and tails
    return "".join([part for part in parts if part])


def name_to_pathname(name):
    """
    Convert a location name for use in a path: replace ':' with '/'.
    This allows users of the xml format to organize content into directories
    """
    return name.replace(":", "/")


class ResourceTemplates:
    """
    Gets the yaml templates associated with a containing cls for display in the Studio.

    The cls must have a 'template_dir_name' attribute. It finds the templates as directly
    in this directory under 'templates'.

    Additional templates can be loaded by setting the
    CUSTOM_RESOURCE_TEMPLATES_DIRECTORY configuration setting.

    Note that a template must end with ".yaml" extension otherwise it will not be
    loaded.
    """

    template_packages = [__name__]

    @classmethod
    def _load_template(cls, template_path, template_id):
        """
        Reads an loads the yaml content provided in the template_path and
        return the content as a dictionary.
        """
        if not os.path.exists(template_path):
            return None

        with open(template_path) as file_object:
            template = yaml.safe_load(file_object)
            template["template_id"] = template_id
            return template

    @classmethod
    def _load_templates_in_dir(cls, dirpath):
        """
        Lists every resource template found in the provided dirpath.
        """
        templates = []
        for template_file in os.listdir(dirpath):
            if not template_file.endswith(".yaml"):
                log.warning("Skipping unknown template file %s", template_file)
                continue

            template = cls._load_template(os.path.join(dirpath, template_file), template_file)
            templates.append(template)
        return templates

    @classmethod
    def templates(cls):
        """
        Returns a list of dictionary field: value objects that describe possible templates that can be used
        to seed a module of this type.

        Expects a class attribute template_dir_name that defines the directory
        inside the 'templates' resource directory to pull templates from.
        """
        templates = {}

        for dirpath in cls.get_template_dirpaths():
            for template in cls._load_templates_in_dir(dirpath):
                templates[template["template_id"]] = template

        return list(templates.values())

    @classmethod
    def get_template_dir(cls):  # pylint: disable=missing-function-docstring
        if getattr(cls, "template_dir_name", None):
            dirname = os.path.join("templates", cls.template_dir_name)
            template_path = resources.files(__name__.rsplit(".", 1)[0]) / dirname

            if not template_path.is_dir():
                log.warning(
                    "No resource directory %s found when loading %s templates",
                    dirname,
                    cls.__name__,
                )
                return None
            return dirname
        return None

    @classmethod
    def get_template_dirpaths(cls):
        """
        Returns of list of directories containing resource templates.
        """
        template_dirpaths = []
        template_dirname = cls.get_template_dir()
        if template_dirname:
            template_path = resources.files(__name__.rsplit(".", 1)[0]) / template_dirname
            if template_path.is_dir():
                with resources.as_file(template_path) as template_real_path:
                    template_dirpaths.append(str(template_real_path))

        custom_template_dir = cls.get_custom_template_dir()
        if custom_template_dir:
            template_dirpaths.append(custom_template_dir)
        return template_dirpaths

    @classmethod
    def get_custom_template_dir(cls):
        """
        If settings.CUSTOM_RESOURCE_TEMPLATES_DIRECTORY is defined, check if it has a
        subdirectory named as the class's template_dir_name and return the full path.
        """
        template_dir_name = getattr(cls, "template_dir_name", None)

        if template_dir_name is None:
            return None

        resource_dir = settings.CUSTOM_RESOURCE_TEMPLATES_DIRECTORY

        if not resource_dir:
            return None

        template_dir_path = os.path.join(resource_dir, template_dir_name)

        if os.path.exists(template_dir_path):
            return template_dir_path
        return None

    @classmethod
    def get_template(cls, template_id):
        """
        Get a single template by the given id (which is the file name identifying it w/in the class's
        template_dir_name)
        """
        for directory in sorted(cls.get_template_dirpaths(), reverse=True):
            abs_path = os.path.join(directory, template_id)
            if os.path.exists(abs_path):
                return cls._load_template(abs_path, template_id)
        return None
