/* JavaScript for VideoBlock. */

requirejs = window.RequireJS.requirejs

function VideoBlock(runtime, element) {
  console.log('In VideoBlock.')

  requirejs(
    [
      'video/00_video_storage.js',
      // 'video/01_initialize.js',
      // 'video/025_focus_grabber.js',
      // 'video/035_video_accessible_menu.js',
      // 'video/04_video_control.js',
      // 'video/04_video_full_screen.js',
      // 'video/05_video_quality_control.js',
      // 'video/06_video_progress_slider.js',
      // 'video/07_video_volume_control.js',
      // 'video/08_video_speed_control.js',
      // 'video/08_video_auto_advance_control.js',
      // 'video/09_video_caption.js',
      // 'video/09_play_placeholder.js',
      // 'video/09_play_pause_control.js',
      // 'video/09_play_skip_control.js',
      // 'video/09_skip_control.js',
      // 'video/09_bumper.js',
      // 'video/09_save_state_plugin.js',
      // 'video/09_events_plugin.js',
      // 'video/09_events_bumper_plugin.js',
      // 'video/09_poster.js',
      // 'video/09_completion.js',
      // 'video/10_commands.js',
      // 'video/095_video_context_menu.js',
      // 'video/036_video_social_sharing.js',
      // 'video/037_video_transcript_feedback.js'
    ],
    function (
      VideoStorage,
      // initialize, FocusGrabber, VideoAccessibleMenu, VideoControl, VideoFullScreen,
      // VideoQualityControl, VideoProgressSlider, VideoVolumeControl, VideoSpeedControl, VideoAutoAdvanceControl,
      // VideoCaption, VideoPlayPlaceholder, VideoPlayPauseControl, VideoPlaySkipControl, VideoSkipControl,
      // VideoBumper, VideoSaveStatePlugin, VideoEventsPlugin, VideoEventsBumperPlugin, VideoPoster,
      // VideoCompletionHandler, VideoCommands, VideoContextMenu, VideoSocialSharing, VideoTranscriptFeedback
    ) {
      var storage = new VideoStorage('VideoState', 0);
      console.log(storage);
    });

  console.log('VideoBlock JS has been loaded.')
}
