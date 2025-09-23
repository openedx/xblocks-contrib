from xblock.core import XBlock
from webob.multidict import MultiDict
from webob import Response

# TODO: Code has been refactored from https://github.com/openedx/edx-platform/blob/master/xmodule/x_module.py#L739
class AjaxHandlerMixin:
    """
    Mixin that provides AJAX handling for XBlocks, including file upload support.
    """
    @property
    def ajax_url(self):
        """
        Get the AJAX handler URL for this XBlock.
        """
        return self.runtime.handler_url(self, 'ajax_handler', '', '').rstrip('/?')

    @XBlock.handler
    def ajax_handler(self, request, suffix=None):
        """
        Process AJAX requests and handle file uploads by wrapping handle_ajax().
        """
        class FileObjForWebobFiles:
            """
            Convert WebOb uploaded files into standard file objects.
            """
            def __init__(self, webob_file):
                self.file = webob_file.file
                self.name = webob_file.filename

            def __getattr__(self, name):
                return getattr(self.file, name)

        # WebOb requests have multiple entries for uploaded files.  handle_ajax
        # expects a single entry as a list.
        request_post = MultiDict(request.POST)
        for key in set(request.POST.keys()):
            if hasattr(request.POST[key], "file"):
                request_post[key] = list(map(FileObjForWebobFiles, request.POST.getall(key)))

        response_data = self.handle_ajax(suffix, request_post)
        return Response(response_data, content_type='application/json', charset='UTF-8')
