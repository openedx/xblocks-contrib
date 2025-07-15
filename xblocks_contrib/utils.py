"""
Miscellaneous utility functions.
"""

import logging
import re
from html.parser import HTMLParser

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
