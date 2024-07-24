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
      if ($0 ~ /^\s*\]/) {
        if (added == 0) {
          print indent new_entry ","
          added = 1
        }
        print
        next
      }
      if (added == 0 && $0 > indent new_entry) {
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
    if (added == 0 && /^__version__/) {
      print new_import
      print ""
      added = 1
    }
    print
  }
  ' "$init_file" > temp_init.py && mv temp_init.py "$init_file"
}

# Prompt user for input
read -p "Enter XBlock name e.g thumbs: " xblock_name
read -p "Enter XBlock class e.g ThumbsXBlock: " xblock_class

# Define paths and filenames
base_dir="xblocks_contrib/$xblock_name"
init_file="$base_dir/__init__.py"
xblock_file="$base_dir/$xblock_name.py"
tx_dir="$base_dir/.tx"
static_dir="$base_dir/static"
css_file="$static_dir/css/$xblock_name.css"
js_file="$static_dir/js/src/$xblock_name.js"
templates_dir="$base_dir/templates"
html_file="$templates_dir/$xblock_name.html"
setup_file="setup.py"
main_init_file="xblocks_contrib/__init__.py"
conf_locale_dir="$base_dir/conf/locale"
utils_config_file="utils/config.yaml"

# Create directories
mkdir -p "$base_dir" "$tx_dir" "$static_dir/css" "$static_dir/js" "$static_dir/js/src" "$templates_dir" "$conf_locale_dir"

# Create empty files
touch "$init_file" "$xblock_file" "$css_file" "$js_file" "$html_file" "$conf_locale_dir/__init__.py"

# Copy config.yaml from utils folder to conf/locale
if [ -f "$utils_config_file" ]; then
  cp "$utils_config_file" "$conf_locale_dir/"
else
  echo "Warning: $utils_config_file does not exist."
fi

# Add content to xblock_name/xblock_name.py
cat > "$xblock_file" <<EOL
"""TO-DO: Write a description of what this XBlock is."""

from importlib.resources import files

from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Integer, Scope


class $xblock_class(XBlock):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        return files(__package__).joinpath(path).read_text()

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        Create primary view of the XBlock class, shown to students when viewing courses.
        """
        if context:
            pass  # TO-DO: do something based on the context.
        html = self.resource_string("templates/$xblock_name.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("static/css/$xblock_name.css"))

        frag.add_javascript(self.resource_string("static/js/src/$xblock_name.js"))
        frag.initialize_js("$xblock_class")
        return frag


    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """Create canned scenario for display in the workbench."""
        return [
            (
                "$xblock_class",
                """<$xblock_name/>
                """,
            ),
            (
                "Multiple $xblock_class",
                """<vertical_demo>
                <$xblock_name/>
                <$xblock_name/>
                <$xblock_name/>
                </vertical_demo>
                """,
            ),
        ]
EOL

# Add content to templates/xblock_name.html
cat > "$html_file" <<EOL
<div class="$xblock_name">
Congratulations XBlock is running.
</div>
EOL

# Add config file to .tx folder
cat > "$tx_dir/config" <<EOL
[main]
host = https://www.transifex.com

[o:open-edx:p:p:xblocks:r:$xblock_name]
file_filter = $xblock_name/translations/<lang>/LC_MESSAGES/text.po
source_file = $xblock_name/translations/en/LC_MESSAGES/text.po
source_lang = en
type        = PO
EOL

# Update setup.py
entry="\"$xblock_name = xblocks_contrib:$xblock_class\""
insert_in_alphabetical_order "$entry" "$setup_file"

# Update xblocks_contrib/__init__.py
import_entry="from .${xblock_name} import ${xblock_class}"
insert_import_before_version "$import_entry" "$main_init_file"

# Update xblock_name/__init__.py
echo "$import_entry" > "$init_file"

echo "XBlock $xblock_name with class $xblock_class created successfully."
