import globals from "globals";
import pluginJs from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";


export default defineConfig([
    globalIgnores([
        // Blocks not yet brought into linting compliance.
        // "xblocks_contrib/annotatable/",
        "xblocks_contrib/discussion/",
        "xblocks_contrib/html/",
        "xblocks_contrib/lti/",
        "xblocks_contrib/poll/",
        "xblocks_contrib/problem/",
        "xblocks_contrib/video/",
        "xblocks_contrib/word_cloud/",
        // Other irrelevant files.
        "docs/_build/",
        "node_modules/",
        ".venv/",
        ".tox/",
    ]),
    {
        files: ["xblocks_contrib/**/static/**/*.js"],
        languageOptions: {
            sourceType: "script",
            globals: {
                "gettext": false,
                ...globals.browser,
                ...globals.jquery,
        }},
    },
    {
        files: ["xblocks_contrib/annotatable/**/*.js"],
        languageOptions: {
            sourceType: "script",
            globals: {
                // Is this available everywhere? Assuming it's only available here.
                "CodeMirror": false,
            }
        }
    },
    pluginJs.configs.recommended,
]);
