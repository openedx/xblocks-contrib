"""
Miscellaneous utility functions.
"""

import re
from html.parser import HTMLParser


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
