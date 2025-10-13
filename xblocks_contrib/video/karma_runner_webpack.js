// import '../../common/static/js/src/ajax_prefix.js';
// import '../../common/static/common/js/vendor/underscore.js';
// import '../../common/static/common/js/vendor/backbone.js';
// import '../../common/static/js/vendor/CodeMirror/codemirror.js';
// import '../../common/static/js/vendor/draggabilly.js';
// import '../../common/static/common/js/vendor/jquery.js';
// import '../../common/static/common/js/vendor/jquery-migrate.js';
// import '../../common/static/js/vendor/jquery.cookie.js';
// import '../../common/static/js/vendor/jquery.leanModal.js';
// import '../../common/static/js/vendor/jquery.timeago.js';
// import './static/js/vendor/query-ui.min.js'
// import '../../common/static/js/vendor/jquery.ui.draggable.js';
// import '../../common/static/js/vendor/json2.js';
// import '../../common/static/js/vendor/tinymce/js/tinymce/jquery.tinymce.min.js';
// import '../../common/static/js/vendor/tinymce/js/tinymce/tinymce.full.min.js';
// import '../../common/static/js/src/accessibility_tools.js';
// import '../../common/static/js/src/utility.js';
// import '../../common/static/js/test/add_ajax_prefix.js';
// import '../../common/static/js/test/i18n.js';
// import '../../common/static/common/js/vendor/hls.js';
// import '../../common/static/js/vendor/jasmine-imagediff.js';
// import '../../common/static/common/js/spec_helpers/jasmine-waituntil.js';
// import '../../common/static/common/js/vendor/sinon.js';


// These libraries are used by the tests (and the code under test)
// but not explicitly imported
// import 'jquery.ui';

import './static/js/src/utils/logger.js';
import './tests/spec_helpers/vertical_student_view.js';
import './tests/spec_helpers/jasmine-extensions.js';
import './tests/spec_helpers/jasmine-waituntil.js';
import './static/js/vendor/jquery-ui.min.js';
import './static/js/vendor/jquery.js';
import './static/js/src/utils/ajax_prefix.js';
import './static/js/src/utils/add_ajax_prefix.js';

// These
// Ensure the Video module initializes before helpers use it

import './static/js/src/10_main.js';
import './tests/spec_helpers/helper.js';
import './tests/spec_helpers/video_helper.js';

import HtmlUtils from 'edx-ui-toolkit/js/utils/html-utils';
import StringUtils from 'edx-ui-toolkit/js/utils/string-utils';


// These are the tests that will be run

//-------- testing 

import './tests/js/async_process_spec.js';
import './tests/js/completion_spec.js';
import './tests/js/general_spec.js';
import './tests/js/initialize_spec.js';
import './tests/js/iterator_spec.js';
import './tests/js/resizer_spec.js';
import './tests/js/sjson_spec.js';
import './tests/js/social_share_spec.js';
import './tests/js/video_context_menu_spec.js';
import './tests/js/video_focus_grabber_spec.js';
import './tests/js/video_full_screen_spec.js';
import './tests/js/video_play_pause_control_spec.js';
import './tests/js/video_play_placeholder_spec.js';
import './tests/js/video_play_skip_control_spec.js';
import './tests/js/video_quality_control_spec.js';
import './tests/js/video_save_state_plugin_spec.js';
import './tests/js/video_skip_control_spec.js';
import './tests/js/video_storage_spec.js';
import './tests/js/video_transcript_feedback_spec.js';
import './tests/js/video_volume_control_spec.js';
import './tests/js/video_autoadvance_spec.js';
import './tests/js/video_events_plugin_spec.js';
import './tests/js/video_control_spec.js';
import './tests/js/video_caption_spec.js';
import './tests/js/video_speed_control_spec.js';
import './tests/js/video_events_bumper_plugin_spec.js';

//-- TODO
// import './tests/js/html5_video_spec.js';
// import './tests/js/video_bumper_spec.js';
//import './tests/js/video_player_spec.js';
// import './tests/js/video_poster_spec.js';
// import './tests/js/video_progress_slider_spec.js';





// // eslint-disable-next-line no-unused-expressions
'use strict';

window._ = _;
// window._.str = str;
window.edx = window.edx || {};
window.edx.HtmlUtils = HtmlUtils;
window.edx.StringUtils = StringUtils;

window.__karma__.loaded = function() {
    setTimeout(function() {
        window.__karma__.start();
    }, 1000);
};
