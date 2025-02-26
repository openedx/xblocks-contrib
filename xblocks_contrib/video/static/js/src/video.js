/* JavaScript for VideoBlock. */

function VideoBlock(runtime, element) {

  var youtubeXhr = null;
  // var oldVideo = window.Video;

  var el = $(element).find('.video'),
    id = el.attr('id').replace(/video_/, ''),
    storage = VideoStorage('VideoState', id),
    bumperMetadata = el.data('bumper-metadata'),
    autoAdvanceEnabled = el.data('autoadvance-enabled') === 'True',
    mainVideoModules = [
      FocusGrabber, VideoControl, VideoPlayPlaceholder,
      VideoPlayPauseControl, VideoProgressSlider, VideoSpeedControl,
      VideoVolumeControl, VideoQualityControl, VideoFullScreen, VideoCaption, VideoCommands,
      VideoContextMenu, VideoSaveStatePlugin, VideoEventsPlugin, VideoCompletionHandler, VideoTranscriptFeedback
    ].concat(autoAdvanceEnabled ? [VideoAutoAdvanceControl] : []),
    bumperVideoModules = [VideoControl, VideoPlaySkipControl, VideoSkipControl,
      VideoVolumeControl, VideoCaption, VideoCommands, VideoSaveStatePlugin, VideoTranscriptFeedback,
      VideoEventsBumperPlugin, VideoCompletionHandler],
    state = {
      el: el,
      id: id,
      metadata: el.data('metadata'),
      storage: storage,
      options: {},
      youtubeXhr: youtubeXhr,
      modules: mainVideoModules
    };

  var getBumperState = function (metadata) {
    var bumperState = $.extend(true, {
      el: el,
      id: id,
      storage: storage,
      options: {},
      youtubeXhr: youtubeXhr
    }, {metadata: metadata});

    bumperState.modules = bumperVideoModules;
    bumperState.options = {
      SaveStatePlugin: {events: ['language_menu:change']}
    };
    return bumperState;
  };

  var player = function (innerState) {
    return function () {
      _.extend(innerState.metadata, {autoplay: true, focusFirstControl: true});
      initialize(innerState, element);
    };
  };

  var onSequenceChange;
  VideoAccessibleMenu(el, {
    storage: storage,
    saveStateUrl: state.metadata.saveStateUrl
  });

  VideoSocialSharing(el);

  if (bumperMetadata) {
    VideoPoster(el, {
      poster: el.data('poster'),
      onClick: _.once(function () {
        var mainVideoPlayer = player(state);
        var bumper, bumperState;
        if (storage.getItem('isBumperShown')) {
          mainVideoPlayer();
        } else {
          bumperState = getBumperState(bumperMetadata);
          bumper = new VideoBumper(player(bumperState), bumperState);
          state.bumperState = bumperState;
          bumper.getPromise().done(function () {
            delete state.bumperState;
            mainVideoPlayer();
          });
        }
      })
    });
  } else {
    initialize(state, element);
  }

  if (!youtubeXhr) {
    youtubeXhr = state.youtubeXhr;
  }

  el.data('video-player-state', state);
  onSequenceChange = function () {
    if (state && state.videoPlayer) {
      state.videoPlayer.destroy();
    }
    $('.sequence').off('sequence:change', onSequenceChange);
  };
  $('.sequence').on('sequence:change', onSequenceChange);
  console.log('VideoBlock JS has been loaded.')
}

//
// /* Vanilla JS */
// (function () {
//   'use strict';
//
//   // Mock Video Constructor
//   window.Video = (function () {
//     var tempCallStack = [];
//
//     return function (element, processTempCallStack) {
//       if (processTempCallStack) {
//         tempCallStack.forEach(function (el) {
//           window.Video(el);
//         });
//         return null;
//       }
//
//       tempCallStack.push(element);
//       return {};
//     };
//   })();
//
//   // Import Dependencies (Assuming they're available as ES modules)
//   import VideoStorage from './video/00_video_storage.js';
//   import initialize from './video/01_initialize.js';
//   import FocusGrabber from './video/025_focus_grabber.js';
//   import VideoAccessibleMenu from './video/035_video_accessible_menu.js';
//   import VideoControl from './video/04_video_control.js';
//   import VideoFullScreen from './video/04_video_full_screen.js';
//   import VideoQualityControl from './video/05_video_quality_control.js';
//   import VideoProgressSlider from './video/06_video_progress_slider.js';
//   import VideoVolumeControl from './video/07_video_volume_control.js';
//   import VideoSpeedControl from './video/08_video_speed_control.js';
//   import VideoAutoAdvanceControl from './video/08_video_auto_advance_control.js';
//   import VideoCaption from './video/09_video_caption.js';
//   import VideoPlayPlaceholder from './video/09_play_placeholder.js';
//   import VideoPlayPauseControl from './video/09_play_pause_control.js';
//   import VideoPlaySkipControl from './video/09_play_skip_control.js';
//   import VideoSkipControl from './video/09_skip_control.js';
//   import VideoBumper from './video/09_bumper.js';
//   import VideoSaveStatePlugin from './video/09_save_state_plugin.js';
//   import VideoEventsPlugin from './video/09_events_plugin.js';
//   import VideoEventsBumperPlugin from './video/09_events_bumper_plugin.js';
//   import VideoPoster from './video/09_poster.js';
//   import VideoCompletionHandler from './video/09_completion.js';
//   import VideoCommands from './video/10_commands.js';
//   import VideoContextMenu from './video/095_video_context_menu.js';
//   import VideoSocialSharing from './video/036_video_social_sharing.js';
//   import VideoTranscriptFeedback from './video/037_video_transcript_feedback.js';
//
//   // Main Video Constructor
//   var youtubeXhr = null;
//
//   window.Video = function (element) {
//     var el = element.querySelector('.video'),
//       id = el.id.replace(/video_/, ''),
//       storage = VideoStorage('VideoState', id),
//       bumperMetadata = el.dataset.bumperMetadata,
//       autoAdvanceEnabled = el.dataset.autoadvanceEnabled === 'True',
//       mainVideoModules = [
//         FocusGrabber, VideoControl, VideoPlayPlaceholder,
//         VideoPlayPauseControl, VideoProgressSlider, VideoSpeedControl,
//         VideoVolumeControl, VideoQualityControl, VideoFullScreen, VideoCaption, VideoCommands,
//         VideoContextMenu, VideoSaveStatePlugin, VideoEventsPlugin, VideoCompletionHandler, VideoTranscriptFeedback
//       ].concat(autoAdvanceEnabled ? [VideoAutoAdvanceControl] : []),
//       bumperVideoModules = [
//         VideoControl, VideoPlaySkipControl, VideoSkipControl, VideoVolumeControl, VideoCaption,
//         VideoCommands, VideoSaveStatePlugin, VideoTranscriptFeedback, VideoEventsBumperPlugin, VideoCompletionHandler
//       ],
//       state = {
//         el: el,
//         id: id,
//         metadata: JSON.parse(el.dataset.metadata),
//         storage: storage,
//         options: {},
//         youtubeXhr: youtubeXhr,
//         modules: mainVideoModules
//       };
//
//     function getBumperState(metadata) {
//       var bumperState = Object.assign({}, state, {metadata});
//       bumperState.modules = bumperVideoModules;
//       bumperState.options = {
//         SaveStatePlugin: {events: ['language_menu:change']}
//       };
//       return bumperState;
//     }
//
//     function player(innerState) {
//       return function () {
//         Object.assign(innerState.metadata, {autoplay: true, focusFirstControl: true});
//         initialize(innerState, element);
//       };
//     }
//
//     var onSequenceChange;
//
//     VideoAccessibleMenu(el, {
//       storage: storage,
//       saveStateUrl: state.metadata.saveStateUrl
//     });
//
//     VideoSocialSharing(el);
//
//     if (bumperMetadata) {
//       VideoPoster(el, {
//         poster: el.dataset.poster,
//         onClick: function () {
//           var mainVideoPlayer = player(state);
//           if (storage.getItem('isBumperShown')) {
//             mainVideoPlayer();
//           } else {
//             var bumperState = getBumperState(bumperMetadata);
//             var bumper = new VideoBumper(player(bumperState), bumperState);
//             state.bumperState = bumperState;
//             bumper.getPromise().then(function () {
//               delete state.bumperState;
//               mainVideoPlayer();
//             });
//           }
//         }
//       });
//     } else {
//       initialize(state, element);
//     }
//
//     if (!youtubeXhr) {
//       youtubeXhr = state.youtubeXhr;
//     }
//
//     el.dataset.videoPlayerState = JSON.stringify(state);
//
//     onSequenceChange = function () {
//       if (state.videoPlayer) {
//         state.videoPlayer.destroy();
//       }
//       document.querySelectorAll('.sequence').forEach(seq =>
//         seq.removeEventListener('sequence:change', onSequenceChange)
//       );
//     };
//
//     document.querySelectorAll('.sequence').forEach(seq =>
//       seq.addEventListener('sequence:change', onSequenceChange)
//     );
//
//     return state;
//   };
//
//   window.Video.clearYoutubeXhr = function () {
//     youtubeXhr = null;
//   };
//
//   window.Video.loadYouTubeIFrameAPI = initialize.prototype.loadYouTubeIFrameAPI;
//
//   // Invoke mock Video constructor to process stored elements
//   if (typeof window.Video === "function") {
//     window.Video(null, true);
//   }
// })();
