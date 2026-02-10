"""Tests for the PDF Block"""
import json
from typing import Any, Optional
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from xblock.field_data import DictFieldData
from xblock.fields import ScopeIds
from xblock.test.toy_runtime import ToyRuntime

from xblock_pdf import PDFBlock


def make_block(**fields: dict[str, Any]) -> PDFBlock:
    """Build a block with specific fields set."""
    scope_ids = ScopeIds("1", "2", "3", "4")
    return PDFBlock(ToyRuntime(), scope_ids=scope_ids, field_data=DictFieldData(data=fields))


def get_student_content(block: PDFBlock) -> str:
    """Get the contents of a student render for a block."""
    frag = block.student_view()
    as_dict = frag.to_dict()
    return as_dict["content"]


def get_studio_content(block: PDFBlock) -> str:
    """Get the contents of the studio render for a block."""
    frag = block.studio_view()
    as_dict = frag.to_dict()
    return as_dict["content"]


def mock_handle_request(data: Optional[dict[str, Any]] = None, method: str = "POST"):
    """Return a request object compatible with an xblock_handler."""
    mock_request = MagicMock()
    mock_request.method = method
    mock_request.body = json.dumps(data).encode("utf-8")
    return mock_request


class TestPDFXBlock(TestCase):
    """Tests for the PDF XBlock"""

    def test_defaults_render(self):
        """Test the basic view loads."""
        scope_ids = ScopeIds("1", "2", "3", "4")
        block = make_block()
        content = get_student_content(block)
        self.assertIn(
            '<iframe src="https://tutorial.math.lamar.edu/pdf/Trig_Cheat_Sheet.pdf"',
            content,
            "PDFBlock did not render correct student view.",
        )

    def test_download_button(self):
        """Test the allow_download toggle."""
        block = make_block(allow_download=True)
        get_student_content(block)
        content = get_student_content(block)
        self.assertIn(
            'Download the PDF',
            content,
            "PDFBlock did not show the download button when it should."
        )
        block.allow_download = False
        content = get_student_content(block)
        self.assertNotIn(
            'Download the PDF',
            content,
            "PDFBlock showed the download button when it shouldn't."
        )

    def test_source_url(self):
        """Test rendering based on whether or not there's a source URL"""
        block = make_block()
        get_student_content(block)
        content = get_student_content(block)
        self.assertNotIn(
            "Download the Source Document",
            content,
            "PDFBlock showed the download source document button when it shouldn't."
        )
        block.source_url = "https://example.com/"
        content = get_student_content(block)
        self.assertIn(
            "Download the source document",
            content,
            "PDFBlock did not show the download source document button when it should."
        )

    def test_studio_view_renders(self):
        """Test rendering of the studio view"""
        block = make_block()
        content = get_studio_content(block)
        self.assertIn(
            '<input class="input setting-input" id="pdf_edit_url"',
            content,
            "PDFBlock did not render correct studio view."
        )

    @override_settings(PDFXBLOCK_DISABLE_ALL_DOWNLOAD=False)
    def test_saves_settings(self):
        """Test that PDF settings are saved."""
        block = make_block()
        request = mock_handle_request({
            "display_name": "Novel application of theory",
            "url": "https://example.com/nature_article.pdf",
            "allow_download": "false",
            "source_text": "Get educated",
            "source_url": "https://example.com/nature_article.tex",
        })
        block.save_pdf(request)
        self.assertEqual(block.display_name, "Novel application of theory")
        self.assertEqual(block.url, "https://example.com/nature_article.pdf")
        self.assertFalse(block.allow_download)
        self.assertEqual(block.source_text, "Get educated")
        self.assertEqual(block.source_url, "https://example.com/nature_article.tex")

    @override_settings(PDFXBLOCK_DISABLE_ALL_DOWNLOAD=True)
    def test_saves_settings_omits_on_download_disabled_flag(self):
        """
        Test that fields relating to download are ignored when the universal
        downloads disabled flag is set.
        """
        block = make_block()
        request = mock_handle_request({
            "display_name": "Novel application of theory",
            "url": "https://example.com/nature_article.pdf",
            # These fields shouldn't be visible on the front end,
            # but should be dropped if they somehow are.
            #
            # Potential future improvement would be saving these
            # but ignoring them when rendering. This is not currently
            # the case since the fields are entirely absent from the studio
            # render, and so would send blank data which would error out.
            "allow_download": "false",
            "source_text": "Get educated",
            "source_url": "https://example.com/nature_article.tex",
        })
        block.save_pdf(request)
        self.assertEqual(block.display_name, "Novel application of theory")
        self.assertEqual(block.url, "https://example.com/nature_article.pdf")
        # Flag will be the default, which is True, even though download will be
        # disabled in practice.
        self.assertTrue(block.allow_download)
        self.assertEqual(block.source_text, "")
        self.assertEqual(block.source_url, "")

    @patch.object(ToyRuntime, "publish")
    def test_download_event_fires(self, mock_publish):
        """Test that we fire a download event."""
        block = make_block()
        request = mock_handle_request()
        block.on_download(request)
        mock_publish.assert_called_with(
            block,
            "edx.pdf.downloaded",
            {
                "url": "https://tutorial.math.lamar.edu/pdf/Trig_Cheat_Sheet.pdf",
                "source_url": "",
            }
        )
