import re
from html.parser import HTMLParser

from lxml import etree


class MLStripper(HTMLParser):
    "helper function for html_to_text below"

    def __init__(self):
        HTMLParser.__init__(self)
        self.reset()
        self.fed = []

    def handle_data(self, data):
        """takes the data in separate chunks"""
        self.fed.append(data)

    def handle_entityref(self, name):
        """appends the reference to the body"""
        self.fed.append("&%s;" % name)

    def get_data(self):
        """joins together the seperate chunks into one cohesive string"""
        return "".join(self.fed)


def html_to_text(html):
    "strips the html tags off of the text to return plaintext"
    htmlstripper = MLStripper()
    htmlstripper.feed(html)
    return htmlstripper.get_data()


def escape_html_characters(content):
    """
    Remove HTML characters that shouldn't be indexed using ElasticSearch indexer
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


def name_to_pathname(name):
    """
    Convert a location name for use in a path: replace ':' with '/'.
    This allows users of the xml format to organize content into directories
    """
    return name.replace(":", "/")


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


def check_html(html):
    """
    Check whether the passed in html string can be parsed by lxml.
    Return bool success.
    """
    parser = etree.HTMLParser()
    try:
        etree.fromstring(html, parser)
        return True
    except Exception:
        pass
    return False
