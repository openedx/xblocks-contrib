"""
Tests for openedx.core.djangolib.markup
"""

import unittest

import ddt
from django.template import Context, Template
from django.utils.translation import gettext as _
from django.utils.translation import ngettext

from xblocks_contrib.problem.markup import HTML, Text


@ddt.ddt
class FormatHtmlTest(unittest.TestCase):
    """Test that we can format plain strings and HTML into them properly."""

    @ddt.data(
        ("hello", "hello"),
        ("<hello>", "&lt;hello&gt;"),
        ("It's cool", "It&#39;s cool"),
        ('"cool," she said.', "&#34;cool,&#34; she said."),
        ("Stop & Shop", "Stop &amp; Shop"),
        ("<a>нтмℓ-єѕ¢αρє∂</a>", "&lt;a&gt;нтмℓ-єѕ¢αρє∂&lt;/a&gt;"),
    )
    def test_simple(self, before_after):
        (before, after) = before_after
        assert str(Text(_(before))) == after
        assert str(Text(before)) == after

    def test_formatting(self):
        # The whole point of this function is to make sure this works:
        out = Text(_("Point & click {start}here{end}!")).format(
            start=HTML("<a href='http://edx.org'>"),
            end=HTML("</a>"),
        )
        assert str(out) == "Point &amp; click <a href='http://edx.org'>here</a>!"

    def test_nested_formatting(self):
        # Sometimes, you have plain text, with html inserted, and the html has
        # plain text inserted.  It gets twisty...
        out = Text(_("Send {start}email{end}")).format(
            start=HTML("<a href='mailto:{email}'>").format(email="A&B"),
            end=HTML("</a>"),
        )
        assert str(out) == "Send <a href='mailto:A&amp;B'>email</a>"

    def test_django_template(self):
        template = Template("{% load i18n %}{{ formatted }}")
        ctx = Context(
            {
                "formatted": Text(_("A & {BC}")).format(BC=HTML("B & C")),
            }
        )
        out = template.render(ctx)
        assert out.strip() == "A &amp; B & C"

    def test_ungettext(self):
        for i in [1, 2]:
            out = Text(ngettext("1 & {}", "2 & {}", i)).format(HTML("<>"))
            assert out == f"{i} &amp; <>"
