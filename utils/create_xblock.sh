#!/bin/bash

# Function to insert entry in alphabetical order in setup.py under "xblock.v1"
insert_in_alphabetical_order() {
  local entry="$1"
  local setup_file="$2"

  awk -v new_entry="$entry" '
  BEGIN { added = 0; indent = "" }
  /entry_points/ { print; next }
  /"xblock.v1"/ {
    print;
    getline
    if (match($0, /^[ \t]+/)) {
      indent = substr($0, RSTART, RLENGTH)
    }
    while (getline > 0) {
      if ($0 ~ /^\s*\]/ && !added) {
        print indent new_entry ","
        added = 1
      }
      if (!added && $0 > indent new_entry) {
        print indent new_entry ","
        added = 1
      }
      print
    }
    next
  }
  { print }
  ' "$setup_file" > temp_setup.py && mv temp_setup.py "$setup_file"
}

# Function to insert import before __version__ variable in __init__.py
insert_import_before_version() {
  local import_entry="$1"
  local init_file="$2"

  awk -v new_import="$import_entry" '
  BEGIN { added = 0 }
  {
    if (!added && /^__version__/) {
      print new_import "\n"
      added = 1
    }
    print
  }
  ' "$init_file" > temp_init.py && mv temp_init.py "$init_file"
}

# Prompt user for XBlock name and class
read -p "Enter XBlock name e.g thumbs: " xblock_name
read -p "Enter XBlock class e.g ThumbsXBlock: " xblock_class

# Define paths and filenames
base_dir="xblocks_contrib/$xblock_name"
init_file="$base_dir/__init__.py"
xblock_file="$base_dir/$xblock_name.py"
static_dir="$base_dir/static"
templates_dir="$base_dir/templates"
conf_locale_dir="$base_dir/conf/locale"
tests_dir="$base_dir/tests"
setup_file="setup.py"
main_init_file="xblocks_contrib/__init__.py"
utils_config_file="utils/config.yaml"

# Create directories
mkdir -p "$base_dir" "$static_dir/css" "$static_dir/js/src" "$templates_dir" "$conf_locale_dir" "$tests_dir"

# Create empty files
touch "$init_file" "$xblock_file" "$static_dir/css/$xblock_name.css" "$static_dir/js/src/$xblock_name.js" "$templates_dir/$xblock_name.html" "$conf_locale_dir/__init__.py"

# Copy config.yaml to conf/locale if it exists
[ -f "$utils_config_file" ] && cp "$utils_config_file" "$conf_locale_dir/" || echo "Warning: $utils_config_file does not exist."

# Populate XBlock file with content
cat > "$xblock_file" <<EOL
from importlib.resources import files
from django.utils import translation
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Integer, Scope
from xblock.utils.resources import ResourceLoader

resource_loader = ResourceLoader(__name__)

@XBlock.needs("i18n")
class $xblock_class(XBlock):
    count = Integer(default=0, scope=Scope.user_state, help="A simple counter")

    is_extracted = True

    def resource_string(self, path):
        return files(__package__).joinpath(path).read_text(encoding="utf-8")

    def student_view(self, context=None):
        frag = Fragment()
        frag.add_content(resource_loader.render_django_template(
            "templates/$xblock_name.html", {"count": self.count},
            i18n_service=self.runtime.service(self, "i18n")
        ))
        frag.add_css(self.resource_string("static/css/$xblock_name.css"))
        frag.add_javascript(self.resource_string("static/js/src/$xblock_name.js"))
        frag.initialize_js("$xblock_class")
        return frag

    @XBlock.json_handler
    def increment_count(self, data, suffix=""):
        self.count += 1
        return {"count": self.count}

    @staticmethod
    def workbench_scenarios():
        return [
            ("$xblock_class", "<$xblock_name/>"),
            ("Multiple $xblock_class", "<vertical_demo><$xblock_name/><$xblock_name/><$xblock_name/></vertical_demo>")
        ]
EOL

# Populate template HTML
cat > "$templates_dir/$xblock_name.html" <<EOL
{% load i18n %}
<div class="$xblock_name">
    <p>$xblock_class: {% trans "count is now" %} <span class='count'>{{ count }}</span> {% trans "click me to increment." %}</p>
</div>
EOL

# Populate JavaScript file
cat > "$static_dir/js/src/$xblock_name.js" <<EOL
function ${xblock_class}(runtime, element) {
    const updateCount = (result) => { \$('.count', element).text(result.count); };
    const handlerUrl = runtime.handlerUrl(element, 'increment_count');
    \$('p', element).on('click', () => {
        \$.ajax({ type: 'POST', url: handlerUrl, contentType: 'application/json', data: JSON.stringify({hello: 'world'}), success: updateCount });
    });
}
EOL

# Populate CSS file
cat > "$static_dir/css/$xblock_name.css" <<EOL
.$xblock_name .count { font-weight: bold; }
.$xblock_name p { cursor: pointer; }
EOL

# Populate test file in the XBlock tests directory
cat > "$tests_dir/test_${xblock_name}.py" <<EOL
from django.test import TestCase
from xblock.fields import ScopeIds
from xblock.test.toy_runtime import ToyRuntime
from xblocks_contrib import ${xblock_class}


class Test${xblock_class}(TestCase):
    def test_my_student_view(self):
        block = ${xblock_class}(ToyRuntime(), scope_ids=ScopeIds("1", "2", "3", "4"))
        frag = block.student_view()
        self.assertIn("${xblock_class}: count is now", frag.to_dict()["content"])
EOL

# Insert XBlock entry in setup.py and __init__.py
insert_in_alphabetical_order "\"$xblock_name = xblocks_contrib:$xblock_class\"" "$setup_file"
insert_import_before_version "from .${xblock_name} import ${xblock_class}" "$main_init_file"
echo "from .${xblock_name} import ${xblock_class}" > "$init_file"

echo "XBlock $xblock_name created successfully with test file."
