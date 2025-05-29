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
from lxml.etree import XMLSyntaxError

log = logging.getLogger(__name__)


class MLStripper(HTMLParser):
    """Helper function for html_to_text below."""

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
        """Collect text data."""
        self.fed.append(data)

    def handle_entityref(self, name):
        """Append the entity reference to the output."""
        self.fed.append("&%s;" % name)

    def get_data(self):
        """Return the collected text as a single string."""
        return "".join(self.fed)


def html_to_text(html):
    """Convert HTML to plain text."""
    htmlstripper = MLStripper()
    htmlstripper.feed(html)
    return htmlstripper.get_data()


def escape_html_characters(content):
    """
    Escape HTML characters for Elasticsearch indexing.

    Args:
        content (str): Variable to escape HTML characters from.

    Returns:
        str: Content ready to be indexed by Elasticsearch.
    """
    return re.sub(
        r"<!--.*-->",
        "",
        re.sub(
            r"<!\[CDATA\[.*\]\]>",
            "",
            re.sub(r"(\s|&nbsp;|//)+", " ", html_to_text(content)),
        ),
    )


def check_html(html):
    """
    Validate if the provided HTML is parseable.

    Returns:
        bool: True if the HTML can be parsed, otherwise False.
    """
    parser = etree.HTMLParser()
    try:
        etree.fromstring(html, parser)
        return True
    except XMLSyntaxError:
        return False


def stringify_children(node):
    """
    Return all contents of an XML node, excluding the outer tags.

    Example:
        Input: <tag>Text <child>child text</child></tag>
        Output: Text <child>child text</child>
    """
    parts = [node.text]
    for c in node.getchildren():
        parts.append(etree.tostring(c, with_tail=True, encoding="unicode"))
    return "".join([part for part in parts if part])


def name_to_pathname(name):
    """
    Convert a location name into a path.

    Replaces ':' with '/' to support directory-based organization.
    """
    return name.replace(":", "/")


class ResourceTemplates:
    """
    Load YAML resource templates for a class with a 'template_dir_name' attribute.

    Supports both packaged and custom template directories. Templates must end with ".yaml".
    """

    template_packages = [__name__]

    @classmethod
    def _load_template(cls, template_path, template_id):
        """
        Load a single YAML template file.

        Returns:
            dict or None: Template content with added 'template_id', or None if path does not exist.
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
        Load all YAML templates from a directory.

        Returns:
            list: List of loaded templates.
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
        Return a list of available resource templates.

        Returns:
            list: List of template dictionaries.
        """
        templates = {}
        for dirpath in cls.get_template_dirpaths():
            for template in cls._load_templates_in_dir(dirpath):
                templates[template["template_id"]] = template
        return list(templates.values())

    @classmethod
    def get_template_dir(cls):
        """
        Return the relative template directory path if defined.

        Returns:
            str or None: Path relative to the package or None if not found.
        """
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
        Return a list of all directories containing resource templates.

        Returns:
            list: List of absolute directory paths.
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
        Return the path to custom templates if defined in settings.

        Returns:
            str or None: Full path to custom templates or None.
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
        Return a specific template by its ID.

        Args:
            template_id (str): The file name of the template.

        Returns:
            dict or None: Template content or None if not found.
        """
        for directory in sorted(cls.get_template_dirpaths(), reverse=True):
            abs_path = os.path.join(directory, template_id)
            if os.path.exists(abs_path):
                return cls._load_template(abs_path, template_id)
        return None
