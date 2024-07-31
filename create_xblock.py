import os

# Get input from the user
xblock_name = input("Enter XBlock name (e.g., thumbs): ")
xblock_class = input("Enter XBlock class (e.g., ThumbsXBlock): ")

# Define file paths
setup_py_path = 'setup.py'
init_py_path = 'xblocks_contrib/__init__.py'
xblock_py_path = f'xblocks_contrib/{xblock_name}.py'
css_path = f'xblocks_contrib/static/css/{xblock_name}.css'
html_path = f'xblocks_contrib/static/html/{xblock_name}.html'
js_path = f'xblocks_contrib/static/js/src/{xblock_name}.js'
test_path = f'tests/test_{xblock_name}.py'

# Update setup.py
with open(setup_py_path, 'r') as file:
    lines = file.readlines()

entry_points_start = None
entry_points_end = None

for i, line in enumerate(lines):
    if line.strip() == "'xblock.v1': [":
        entry_points_start = i + 1
    if entry_points_start and line.strip() == "]":
        entry_points_end = i
        break

if entry_points_start is None or entry_points_end is None:
    raise ValueError("Cannot find the 'xblock.v1' entry points section in setup.py")

entry_lines = lines[entry_points_start:entry_points_end]
entry_lines.append(f"            '{xblock_name} = xblocks_contrib:{xblock_class}',\n")
entry_lines = sorted(entry_lines)

lines = lines[:entry_points_start] + entry_lines + lines[entry_points_end:]

with open(setup_py_path, 'w') as file:
    file.writelines(lines)

# Update __init__.py
with open(init_py_path, 'r') as file:
    init_lines = file.readlines()

import_statement = f"from .{xblock_name} import {xblock_class}\n"
for i, line in enumerate(init_lines):
    if line.startswith('from .'):
        init_lines.insert(i + 1, import_statement)
        break
else:
    init_lines.append(import_statement)

with open(init_py_path, 'w') as file:
    file.writelines(init_lines)

# Create xblock_name.py file with the updated content
xblock_content = f"""\"\"\"TO-DO: Write a description of what this XBlock is.\"\"\"

from importlib.resources import files

from django.utils import translation
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Integer, Scope
from xblock.utils.resources import ResourceLoader

resource_loader = ResourceLoader(__name__)


@XBlock.needs('i18n')
class {xblock_class}(XBlock):
    \"\"\"
    TO-DO: document what your XBlock does.
    \"\"\"

    count = Integer(
        default=0,
        scope=Scope.user_state,
        help="A simple counter, to show something happening",
    )

    def resource_string(self, path):
        \"\"\"Handy helper for getting resources from our kit.\"\"\"
        return files(__package__).joinpath(path).read_text(encoding="utf-8")

    def student_view(self, context=None):
        \"\"\"
        Create primary view of the {xblock_class}, shown to students when viewing courses.
        \"\"\"
        if context:
            pass  # TO-DO: do something based on the context.
        html = self.resource_string("static/html/{xblock_name}.html")
        frag = Fragment(html.format(self=self))

        frag = Fragment()
        frag.add_content(resource_loader.render_django_template(
            'static/html/{xblock_name}.html',
            {{
                'count': self.count,
            }},
            i18n_service=self.runtime.service(self, 'i18n')
        ))
        frag.add_css(self.resource_string("static/css/{xblock_name}.css"))
        frag.add_javascript(self.resource_string("static/js/src/{xblock_name}.js"))
        frag.initialize_js("{xblock_class}")
        return frag

    @XBlock.json_handler
    def increment_count(self, data, suffix=""):
        \"\"\"
        Increments data. An example handler.
        \"\"\"
        if suffix:
            pass  # TO-DO: Use the suffix when storing data.
        # Just to show data coming in...
        assert data["hello"] == "world"

        self.count += 1
        return {{"count": self.count}}

    @staticmethod
    def workbench_scenarios():
        \"\"\"Create canned scenario for display in the workbench.\"\"\"
        return [
            (
                "{xblock_class}",
                \"\"\"<{xblock_name}/>
                \"\"\",
            ),
            (
                "Multiple {xblock_class}",
                \"\"\"<vertical_demo>
                <{xblock_name}/>
                <{xblock_name}/>
                <{xblock_name}/>
                </vertical_demo>
                \"\"\",
            ),
        ]

    @staticmethod
    def get_dummy():
        \"\"\"
        Generate initial i18n with dummy method.
        \"\"\"
        return translation.gettext_noop("Dummy")
"""

os.makedirs(os.path.dirname(xblock_py_path), exist_ok=True)
with open(xblock_py_path, 'w') as file:
    file.write(xblock_content)

# Create CSS file
css_content = f"""/* CSS for {xblock_class} */

.{xblock_name}_xblock .count {{
    font-weight: bold;
}}

.{xblock_name}_xblock p {{
    cursor: pointer;
}}
"""

os.makedirs(os.path.dirname(css_path), exist_ok=True)
with open(css_path, 'w') as file:
    file.write(css_content)

# Create HTML file
html_content = f"""<div class="{xblock_name}_xblock">
    <p>{xblock_class}: count is now
        <span class='count'>{{{{count}}}}</span> (click me to increment).
    </p>
</div>
"""

os.makedirs(os.path.dirname(html_path), exist_ok=True)
with open(html_path, 'w') as file:
    file.write(html_content)

# Create JavaScript file
js_content = f"""/* Javascript for {xblock_class}. */
function {xblock_class}(runtime, element) {{

    function updateCount(result) {{
        $('.count', element).text(result.count);
    }}

    var handlerUrl = runtime.handlerUrl(element, 'increment_count');

    $('p', element).click(function(eventObject) {{
        $.ajax({{
            type: "POST",
            url: handlerUrl,
            data: JSON.stringify({{"hello": "world"}}),
            success: updateCount
        }});
    }});

    $(function ($) {{
        /*
        Use `gettext` provided by django-statici18n for static translations

        var gettext = {xblock_class}i18n.gettext;
        */

        /* Here's where you'd do things on page load. */

        // dummy_text is to have at least one string to translate in JS files. If you remove this line,
        // and you don't have any other string to translate in JS files; then you must remove the (--merge-po-files)
        // option from the "extract_translations" command in the Makefile
        const dummy_text = gettext("Hello World");
    }});
}}
"""

os.makedirs(os.path.dirname(js_path), exist_ok=True)
with open(js_path, 'w') as file:
    file.write(js_content)

# Create test file
test_content = f"""\"\"\"
Tests for {xblock_class}
\"\"\"

from django.test import TestCase
from xblock.fields import ScopeIds
from xblock.test.toy_runtime import ToyRuntime

from xblocks_contrib import {xblock_class}


class TestXBlocksContrib(TestCase):
    \"\"\"Tests for {xblock_class}\"\"\"
    def test_my_student_view(self):
        \"\"\"Test the basic view loads.\"\"\"
        scope_ids = ScopeIds('1', '2', '3', '4')
        block = {xblock_class}(ToyRuntime(), scope_ids=scope_ids)
        frag = block.student_view()
        as_dict = frag.to_dict()
        content = as_dict['content']
        self.assertIn('{xblock_class}: count is now', content, 'XBlock did not render correct student view')
"""

os.makedirs(os.path.dirname(test_path), exist_ok=True)
with open(test_path, 'w') as file:
    file.write(test_content)

print("XBlock files and setup updated successfully!")
