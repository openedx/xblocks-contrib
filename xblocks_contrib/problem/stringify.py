# pylint: disable=missing-module-docstring
from lxml import etree


def stringify_children(node):
    """
    Return all contents of an XML tree, without the outside tags.

    Example:
        If ``node`` is a parse of::

            <html a="b" foo="bar">Hi <div>there <span>Bruce</span><b>!</b></div></html>

        this function should return::

            Hi <div>there <span>Bruce</span><b>!</b></div>

    Fixed from:
        https://stackoverflow.com/questions/4624062/get-all-text-inside-a-tag-in-lxml
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
        parts.append(etree.tostring(c, with_tail=True, encoding='unicode'))

    # filter removes possible Nones in texts and tails
    return ''.join([part for part in parts if part])
