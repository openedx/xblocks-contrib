/* global MathJax, Collapsible, interpolate, JavascriptLoader, Logger, CodeMirror */
// Note: this code was originally converted from CoffeeScript, and thus follows some
// coding conventions that are discouraged by eslint. Some warnings have been suppressed
// to avoid substantial rewriting of the code. Allow the eslint suppressions to exceed
// the max line length of 120.
/* eslint max-len: ["error", 120, { "ignoreComments": true }] */

function Problem(runtime, element) {
    'use strict';

    var JavascriptLoader = {
    executeModuleScripts: function(element, callback) {
        // Find all script tags within the provided jQuery element
            $(element).find('script').each(function() {
                var scriptNode = this;
                var newScript = document.createElement('script');

                // Copy the script type attribute
                if (scriptNode.type) {
                    newScript.type = scriptNode.type;
                }

                // If the script has a 'src', it's an external file.
                // Otherwise, it's an inline script with text content.
                if (scriptNode.src) {
                    newScript.src = scriptNode.src;
                } else {
                    newScript.textContent = scriptNode.textContent;
                }

                // Append the new script to the document's head to execute it,
                // then remove it immediately to keep the DOM clean.
                document.head.appendChild(newScript).parentNode.removeChild(newScript);
            });

            // If a callback function was provided, execute it asynchronously
            // to ensure the DOM has had a chance to update.
            if (typeof callback === 'function') {
                setTimeout(callback, 0);
            }
        }
    };


    var indexOfHelper = [].indexOf
        || function(item) {
            var i, len;
            for (i = 0, len = this.length; i < len; i++) {
                if (i in this && this[i] === item) {
                    return i;
                }
            }
            return -1;
        };

    // --- Module-level variables (formerly instance properties) ---
    var el = $(element).find('.problems-wrapper');
    var id = el.data('problem-id');
    var element_id = el.attr('id');
    var url = el.data('url');
    var content = el.data('content');

    // State variables
    var has_timed_out = false;
    var has_response = false;
    var answers;
    var queued_items;
    var num_queued_items;
    var new_queued_items;
    var inputtypeDisplays = {};

    // Element references
    var inputs;
    var reviewButton;
    var submitButton;
    var submitButtonLabel;
    var submitButtonSubmitText;
    var submitButtonSubmittingText;
    var hintButton;
    var resetButton;
    var showButton;
    var saveButton;
    var saveNotification;
    var showAnswerNotification;
    var gentleAlertNotification;
    var submitNotification;


    // --- Initialization ---

    function init() {
        // has_timed_out and has_response are used to ensure that
        // we wait a minimum of ~ 1s before transitioning the submit
        // button from disabled to enabled
        has_timed_out = false;
        has_response = false;
        render(content);
    }


    // --- Core Methods ---

    function render(renderContent, focusCallback) {
        if (renderContent) {
            edx.HtmlUtils.setHtml(el, edx.HtmlUtils.HTML(renderContent));
            return JavascriptLoader.executeModuleScripts(el, function() {
                setupInputTypes();
                bind();
                queueing(focusCallback);
                renderProgressState();
                // eslint-disable-next-line no-void
                return typeof focusCallback === 'function' ? focusCallback() : void 0;
            });
        } else {
            return $.postWithPrefix('' + url + '/problem_get', function(response) {
                edx.HtmlUtils.setHtml(el, edx.HtmlUtils.HTML(response.html));
                return JavascriptLoader.executeModuleScripts(el, function() {
                    setupInputTypes();
                    bind();
                    queueing();
                    return forceUpdate(response);
                });
            });
        }
    }

    function bind() {
        var problemPrefix;
        if (typeof MathJax !== 'undefined' && MathJax !== null) {
            el.find('.problem > div').each(function(index, element) {
                return MathJax.Hub.Queue(['Typeset', MathJax.Hub, element]);
            });
        }
        if (window.hasOwnProperty('update_schematics')) {
            window.update_schematics();
        }
        problemPrefix = element_id.replace(/problem_/, '');
        inputs = el.find('[id^="input_' + problemPrefix + '_"]');
        el.find('div.action button').click(refreshAnswers);
        reviewButton = el.find('.notification-btn.review-btn');
        reviewButton.click(scroll_to_problem_meta);
        submitButton = el.find('.action .submit');
        submitButtonLabel = el.find('.action .submit .submit-label');
        submitButtonSubmitText = submitButtonLabel.text();
        submitButtonSubmittingText = submitButton.data('submitting');
        submitButton.click(submit_fd);
        hintButton = el.find('.action .hint-button');
        hintButton.click(hint_button);
        resetButton = el.find('.action .reset');
        resetButton.click(reset);
        showButton = el.find('.action .show');
        showButton.click(show);
        saveButton = el.find('.action .save');
        saveNotification = el.find('.notification-save');
        showAnswerNotification = el.find('.notification-show-answer');
        saveButton.click(save);
        gentleAlertNotification = el.find('.notification-gentle-alert');
        submitNotification = el.find('.notification-submit');

        // Accessibility helper for sighted keyboard users to show <clarification> tooltips on focus:
        el.find('.clarification').focus(function(ev) {
            var icon;
            icon = $(ev.target).children('i');
            return window.globalTooltipManager.openTooltip(icon);
        });
        el.find('.clarification').blur(function() {
            return window.globalTooltipManager.hide();
        });
        el.find('.review-btn').focus(function(ev) {
            return $(ev.target).removeClass('sr');
        });
        el.find('.review-btn').blur(function(ev) {
            return $(ev.target).addClass('sr');
        });
        bindResetCorrectness();
        if (submitButton.length) {
            submitAnswersAndSubmitButton(true);
        }
        Collapsible.setCollapsibles(el);
        el.find('input.math').keyup(refreshMath);
        if (typeof MathJax !== 'undefined' && MathJax !== null) {
            el.find('input.math').each(function(index, mathElement) {
                return MathJax.Hub.Queue([refreshMath, null, mathElement]);
            });
        }
    }


    // --- Event Handlers & Actions ---

    function submit() {
        if (!submit_save_waitfor(submit_internal)) {
            disableAllButtonsWhileRunning(submit_internal, true);
        }
    }

    function submit_internal() {
        Logger.log('problem_check', answers);
        return $.postWithPrefix('' + url + '/problem_check', answers, function(response) {
            switch (response.success) {
            case 'submitted':
            case 'incorrect':
            case 'correct':
                window.SR.readTexts(get_sr_status(response.contents));
                el.trigger('contentChanged', [id, response.contents, response]);
                render(response.contents, focus_on_submit_notification);
                updateProgress(response);
                // This is used by the Learning MFE to know when the Entrance Exam has been passed
                // for a user. The MFE is then able to respond appropriately.
                if (response.entrance_exam_passed) {
                    window.parent.postMessage({type: 'entranceExam.passed'}, '*');
                }
                break;
            default:
                saveNotification.hide();
                gentle_alert(response.success);
            }
            return Logger.log('problem_graded', [answers, response.contents], id);
        });
    }

    function submit_fd() {
        var abortSubmission, error, errorHtml, errors, fd, fileNotSelected, fileTooLarge, maxFileSize,
            requiredFilesNotSubmitted, settings, timeoutId, unallowedFileSubmitted, i, len;

        // If there are no file inputs in the problem, we can fall back on submit.
        if (el.find('input:file').length === 0) {
            submit();
            return;
        }
        enableSubmitButton(false);
        if (!window.FormData) {
            alert(gettext('Submission aborted! Sorry, your browser does not support file uploads. If you can, please use Chrome or Safari which have been verified to support file uploads.')); // eslint-disable-line max-len, no-alert
            enableSubmitButton(true);
            return;
        }
        timeoutId = enableSubmitButtonAfterTimeout();
        fd = new FormData();

        // Sanity checks on submission
        maxFileSize = 4 * 1000 * 1000;
        fileTooLarge = false;
        fileNotSelected = false;
        requiredFilesNotSubmitted = false;
        unallowedFileSubmitted = false;

        errors = [];
        inputs.each(function(index, inputElement) {
            var allowedFiles, file, maxSize, requiredFiles, loopI, loopLen, ref;
            if (inputElement.type === 'file') {
                requiredFiles = $(inputElement).data('required_files');
                allowedFiles = $(inputElement).data('allowed_files');
                ref = inputElement.files;
                for (loopI = 0, loopLen = ref.length; loopI < loopLen; loopI++) {
                    file = ref[loopI];
                    if (allowedFiles.length !== 0 && indexOfHelper.call(allowedFiles, file.name) < 0) {
                        unallowedFileSubmitted = true;
                        errors.push(edx.StringUtils.interpolate(
                            gettext('You submitted {filename}; only {allowedFiles} are allowed.'), {
                                filename: file.name,
                                allowedFiles: allowedFiles
                            }
                        ));
                    }
                    if (indexOfHelper.call(requiredFiles, file.name) >= 0) {
                        requiredFiles.splice(requiredFiles.indexOf(file.name), 1);
                    }
                    if (file.size > maxFileSize) {
                        fileTooLarge = true;
                        maxSize = maxFileSize / (1000 * 1000);
                        errors.push(edx.StringUtils.interpolate(
                            gettext('Your file {filename} is too large (max size: {maxSize}MB).'), {
                                filename: file.name,
                                maxSize: maxSize
                            }
                        ));
                    }
                    fd.append(inputElement.id, file); // xss-lint: disable=javascript-jquery-append
                }
                if (inputElement.files.length === 0) {
                    fileNotSelected = true;
                    // In case we want to allow submissions with no file
                    fd.append(inputElement.id, ''); // xss-lint: disable=javascript-jquery-append
                }
                if (requiredFiles.length !== 0) {
                    requiredFilesNotSubmitted = true;
                    errors.push(edx.StringUtils.interpolate(
                        gettext('You did not submit the required files: {requiredFiles}.'), {
                            requiredFiles: requiredFiles
                        }
                    ));
                }
            } else {
                fd.append(inputElement.id, inputElement.value); // xss-lint: disable=javascript-jquery-append
            }
        });
        if (fileNotSelected) {
            errors.push(gettext('You did not select any files to submit.'));
        }
        errorHtml = '';
        for (i = 0, len = errors.length; i < len; i++) {
            error = errors[i];
            errorHtml = edx.HtmlUtils.joinHtml(
                errorHtml,
                edx.HtmlUtils.interpolateHtml(edx.HtmlUtils.HTML('<li>{error}</li>'), {error: error})
            );
        }
        errorHtml = edx.HtmlUtils.interpolateHtml(edx.HtmlUtils.HTML('<ul>{errors}</ul>'), {errors: errorHtml});
        gentle_alert(errorHtml.toString());
        abortSubmission = fileTooLarge || fileNotSelected || unallowedFileSubmitted || requiredFilesNotSubmitted;
        if (abortSubmission) {
            window.clearTimeout(timeoutId);
            enableSubmitButton(true);
        } else {
            settings = {
                type: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                complete: enableSubmitButtonAfterResponse,
                success: function(response) {
                    switch (response.success) {
                    case 'submitted':
                    case 'incorrect':
                    case 'correct':
                        render(response.contents);
                        updateProgress(response);
                        break;
                    default:
                        gentle_alert(response.success);
                    }
                    return Logger.log('problem_graded', [answers, response.contents], id);
                },
                error: function(response) {
                    gentle_alert(response.responseJSON.success);
                }
            };
            $.ajaxWithPrefix('' + url + '/problem_check', settings);
        }
    }

    function reset() {
        return disableAllButtonsWhileRunning(reset_internal, false);
    }

    function reset_internal() {
        Logger.log('problem_reset', answers);
        return $.postWithPrefix('' + url + '/problem_reset', {
            id: id
        }, function(response) {
            if (response.success) {
                el.trigger('contentChanged', [id, response.html, response]);
                render(response.html, scroll_to_problem_meta);
                updateProgress(response);
                return window.SR.readText(gettext('This problem has been reset.'));
            } else {
                return gentle_alert(response.msg);
            }
        });
    }

    function show() {
        Logger.log('problem_show', {
            problem: id
        });
        return $.postWithPrefix('' + url + '/problem_show', function(response) {
            var problemAnswers = response.answers;
            $.each(problemAnswers, function(key, value) {
                var safeKey = key.replace(':', '\\:'); // fix for courses which use url_names with colons, e.g. problem:question1
                safeKey = safeKey.replace(/\./g, '\\.'); // fix for courses which use url_names with periods. e.g. question1.1
                var answerEl;
                if (!$.isArray(value)) {
                    answerEl = el.find('#answer_' + safeKey + ', #solution_' + safeKey);
                    edx.HtmlUtils.setHtml(answerEl, edx.HtmlUtils.HTML(value));
                    Collapsible.setCollapsibles(answerEl);
                    try {
                        return $(value).find('.detailed-solution');
                    } catch (e) {
                        return {};
                    }
                }
            });
            el.find('.capa_inputtype').each(function(index, inputtype) {
                var classes, cls, display, showMethod, i, len, results;
                classes = $(inputtype).attr('class').split(' ');
                results = [];
                for (i = 0, len = classes.length; i < len; i++) {
                    cls = classes[i];
                    display = inputtypeDisplays[$(inputtype).attr('id')];
                    showMethod = inputtypeShowAnswerMethods[cls];
                    if (showMethod != null) {
                        results.push(showMethod(inputtype, display, problemAnswers, response.correct_status_html));
                    } else {
                        // eslint-disable-next-line no-void
                        results.push(void 0);
                    }
                }
                return results;
            });
            if (typeof MathJax !== 'undefined' && MathJax !== null) {
                el.find('.problem > div').each(function(index, mathElement) {
                    return MathJax.Hub.Queue(['Typeset', MathJax.Hub, mathElement]);
                });
            }
            el.find('.show').attr('disabled', 'disabled');
            updateProgress(response);
            clear_all_notifications();
            showAnswerNotification.show();
            focus_on_notification('show-answer');
        });
    }

    function save() {
        if (!submit_save_waitfor(save_internal)) {
            disableAllButtonsWhileRunning(save_internal, false);
        }
    }

    function save_internal() {
        Logger.log('problem_save', answers);
        return $.postWithPrefix('' + url + '/problem_save', answers, function(response) {
            var saveMessage;
            saveMessage = response.msg;
            if (response.success) {
                el.trigger('contentChanged', [id, response.html, response]);
                edx.HtmlUtils.setHtml(
                    el.find('.notification-save .notification-message'),
                    edx.HtmlUtils.HTML(saveMessage)
                );
                clear_all_notifications();
                el.find('.wrapper-problem-response .message').hide();
                saveNotification.show();
                focus_on_save_notification();
            } else {
                gentle_alert(saveMessage);
            }
        });
    }

    function hint_button() {
        var hintContainer, hintIndex, nextIndex;
        hintContainer = el.find('.problem-hint');
        hintIndex = hintContainer.attr('hint_index');
        // eslint-disable-next-line no-void
        if (hintIndex === void 0) {
            nextIndex = 0;
        } else {
            nextIndex = parseInt(hintIndex, 10) + 1;
        }
        return $.postWithPrefix('' + url + '/hint_button', {
            hint_index: nextIndex,
            input_id: id
        }, function(response) {
            var hintMsgContainer;
            if (response.success) {
                hintMsgContainer = el.find('.problem-hint .notification-message');
                hintContainer.attr('hint_index', response.hint_index);
                edx.HtmlUtils.setHtml(hintMsgContainer, edx.HtmlUtils.HTML(response.msg));
                MathJax.Hub.Queue(['Typeset', MathJax.Hub, hintContainer[0]]);
                if (response.should_enable_next_hint) {
                    hintButton.removeAttr('disabled');
                } else {
                    hintButton.attr({disabled: 'disabled'});
                }
                el.find('.notification-hint').show();
                focus_on_hint_notification(nextIndex);
            } else {
                gentle_alert(response.msg);
            }
        });
    }

    // --- Helper Functions ---

    function get_sr_status(contents) {
        var addedStatus, ariaLabel, srElement, labeledStatus, parentSection, statusElement, template, i, len;
        statusElement = $(contents).find('.status');
        labeledStatus = [];
        for (i = 0, len = statusElement.length; i < len; i++) {
            srElement = statusElement[i];
            parentSection = $(srElement).closest('.wrapper-problem-response');
            addedStatus = false;
            if (parentSection) {
                ariaLabel = parentSection.attr('aria-label');
                if (ariaLabel) {
                    template = gettext('{label}: {status}');
                    labeledStatus.push(edx.StringUtils.interpolate(
                        template, {
                            label: ariaLabel,
                            status: $(srElement).text()
                        }
                    ));
                    addedStatus = true;
                }
            }
            if (!addedStatus) {
                labeledStatus.push($(srElement).text());
            }
        }
        return labeledStatus;
    }

    function gentle_alert(msg) {
        edx.HtmlUtils.setHtml(
            el.find('.notification-gentle-alert .notification-message'),
            edx.HtmlUtils.HTML(msg)
        );
        clear_all_notifications();
        gentleAlertNotification.show();
        gentleAlertNotification.focus();
    }

    function clear_all_notifications() {
        submitNotification.remove();
        gentleAlertNotification.hide();
        saveNotification.hide();
        showAnswerNotification.hide();
    }

    function refreshAnswers() {
        el.find('input.schematic').each(function(index, schematicElement) {
            return schematicElement.schematic.update_value();
        });
        el.find('.CodeMirror').each(function(index, cmElement) {
            if (cmElement.CodeMirror.save) {
                cmElement.CodeMirror.save();
            }
        });
        answers = inputs.serialize();
    }

    function refreshMath(event, mathElement) {
        var elid, eqn, jax, mathjaxPreprocessor, preprocessorTag, target;
        if (!mathElement) {
            mathElement = event.target; // eslint-disable-line no-param-reassign
        }
        elid = mathElement.id.replace(/^input_/, '');
        target = 'display_' + elid;
        preprocessorTag = 'inputtype_' + elid;
        mathjaxPreprocessor = inputtypeDisplays[preprocessorTag];
        if (typeof MathJax !== 'undefined' && MathJax !== null && MathJax.Hub.getAllJax(target)[0]) {
            jax = MathJax.Hub.getAllJax(target)[0];
            eqn = $(mathElement).val();
            if (mathjaxPreprocessor) {
                eqn = mathjaxPreprocessor(eqn);
            }
            MathJax.Hub.Queue(['Text', jax, eqn], [updateMathML, jax, mathElement]);
        }
    }

    function updateMathML(jax, mathElement) {
        try {
            $('#' + mathElement.id + '_dynamath').val(jax.root.toMathML(''));
        } catch (exception) {
            if (!exception.restart) {
                throw exception;
            }
            if (typeof MathJax !== 'undefined' && MathJax !== null) {
                MathJax.Callback.After([refreshMath, jax], exception.restart);
            }
        }
    }

    function scroll_to_problem_meta() {
        var questionTitle;
        questionTitle = el.find('.problem-header');
        if (questionTitle.length > 0) {
            $('html, body').animate({
                scrollTop: questionTitle.offset().top
            }, 500);
            questionTitle.focus();
        }
    }

    function focus_on_notification(type) {
        var notification;
        notification = el.find('.notification-' + type);
        if (notification.length > 0) {
            notification.focus();
        }
    }

    function focus_on_submit_notification() {
        focus_on_notification('submit');
    }

    function focus_on_hint_notification(hintIndex) {
        el.find('.notification-hint .notification-message > ol > li.hint-index-' + hintIndex).focus();
    }

    function focus_on_save_notification() {
        focus_on_notification('save');
    }

    // --- State & Progress Management ---

    function renderProgressState() {
        var graded, progress, progressTemplate, curScore, totalScore, attemptsUsed;
        curScore = el.data('problem-score');
        totalScore = el.data('problem-total-possible');
        attemptsUsed = el.data('attempts-used');
        graded = el.data('graded');

        if (graded === 'True' && totalScore !== 0) {
            graded = true;
        } else {
            graded = false;
        }

        if (curScore === undefined || totalScore === undefined) {
            progressTemplate = '';
        } else if (curScore === null || curScore === 'None') {
            if (graded) {
                progressTemplate = ngettext('{num_points} point possible (graded, results hidden)', '{num_points} points possible (graded, results hidden)', totalScore);
            } else {
                progressTemplate = ngettext('{num_points} point possible (ungraded, results hidden)', '{num_points} points possible (ungraded, results hidden)', totalScore);
            }
        } else if ((attemptsUsed === 0 || totalScore === 0) && curScore === 0) {
            if (graded) {
                progressTemplate = ngettext('{num_points} point possible (graded)', '{num_points} points possible (graded)', totalScore);
            } else {
                progressTemplate = ngettext('{num_points} point possible (ungraded)', '{num_points} points possible (ungraded)', totalScore);
            }
        } else {
            if (graded) {
                progressTemplate = ngettext('{earned}/{possible} point (graded)', '{earned}/{possible} points (graded)', totalScore);
            } else {
                progressTemplate = ngettext('{earned}/{possible} point (ungraded)', '{earned}/{possible} points (ungraded)', totalScore);
            }
        }
        progress = edx.StringUtils.interpolate(
            progressTemplate, {
                earned: curScore,
                num_points: totalScore,
                possible: totalScore
            }
        );
        return el.find('.problem-progress').text(progress);
    }

    function updateProgress(response) {
        if (response.progress_changed) {
            el.data('problem-score', response.current_score);
            el.data('problem-total-possible', response.total_possible);
            el.data('attempts-used', response.attempts_used);
            el.trigger('progressChanged');
        }
        return renderProgressState();
    }

    function forceUpdate(response) {
        el.data('problem-score', response.current_score);
        el.data('problem-total-possible', response.total_possible);
        el.data('attempts-used', response.attempts_used);
        el.trigger('progressChanged');
        return renderProgressState();
    }

    function queueing(focusCallback) {
        queued_items = el.find('.xqueue');
        num_queued_items = queued_items.length;
        if (num_queued_items > 0) {
            if (window.queuePollerID) {
                window.clearTimeout(window.queuePollerID);
            }
            window.queuePollerID = window.setTimeout(function() {
                return poll(1000, focusCallback);
            }, 1000);
        }
    }

    function poll(previousTimeout, focusCallback) {
        return $.postWithPrefix('' + url + '/problem_get', function(response) {
            var newTimeout;
            new_queued_items = $(response.html).find('.xqueue');
            if (new_queued_items.length !== num_queued_items) {
                edx.HtmlUtils.setHtml(el, edx.HtmlUtils.HTML(response.html)).promise().done(function() {
                    // eslint-disable-next-line no-void
                    return typeof focusCallback === 'function' ? focusCallback() : void 0;
                });
                JavascriptLoader.executeModuleScripts(el, function() {
                    setupInputTypes();
                    bind();
                });
            }
            num_queued_items = new_queued_items.length;
            if (num_queued_items === 0) {
                forceUpdate(response);
                delete window.queuePollerID;
            } else {
                newTimeout = previousTimeout * 2;
                if (newTimeout >= 60000) {
                    delete window.queuePollerID;
                    gentle_alert(
                        gettext('The grading process is still running. Refresh the page to see updates.')
                    );
                } else {
                    window.queuePollerID = window.setTimeout(function() {
                        return poll(newTimeout, focusCallback);
                    }, newTimeout);
                }
            }
        });
    }

    // --- Button & Input Controls ---

    function disableAllButtonsWhileRunning(operationCallback, isFromCheckOperation) {
        var allButtons = [resetButton, saveButton, showButton, hintButton, submitButton];
        var initiallyEnabledButtons = allButtons.filter(function(button) {
            return !button.attr('disabled');
        });
        enableButtons(initiallyEnabledButtons, false, isFromCheckOperation);
        return operationCallback().always(function() {
            return enableButtons(initiallyEnabledButtons, true, isFromCheckOperation);
        });
    }

    function enableButtons(buttons, enable, changeSubmitButtonText) {
        buttons.forEach(function(button) {
            if (button.hasClass('submit')) {
                enableSubmitButton(enable, changeSubmitButtonText);
            } else if (enable) {
                button.removeAttr('disabled');
            } else {
                button.attr({disabled: 'disabled'});
            }
        });
    }

    function enableSubmitButton(enable, changeText) {
        var submitCanBeEnabled;
        if (changeText === null || changeText === undefined) {
            changeText = true; // eslint-disable-line no-param-reassign
        }
        if (enable) {
            submitCanBeEnabled = submitButton.data('should-enable-submit-button') === 'True';
            if (submitCanBeEnabled) {
                submitButton.removeAttr('disabled');
            }
            if (changeText) {
                submitButtonLabel.text(submitButtonSubmitText);
            }
        } else {
            submitButton.attr({disabled: 'disabled'});
            if (changeText) {
                submitButtonLabel.text(submitButtonSubmittingText);
            }
        }
    }

    function enableSubmitButtonAfterResponse() {
        has_response = true;
        if (!has_timed_out) {
            return enableSubmitButton(false);
        } else {
            return enableSubmitButton(true);
        }
    }

    function enableSubmitButtonAfterTimeout() {
        var enableSubmitBtn;
        has_timed_out = false;
        has_response = false;
        enableSubmitBtn = function() {
            has_timed_out = true;
            if (has_response) {
                enableSubmitButton(true);
            }
        };
        return window.setTimeout(enableSubmitBtn, 750);
    }

    function submitAnswersAndSubmitButton(isBind) {
        var answered, atLeastOneTextInputFound, oneTextInputFilled;
        if (isBind === null || isBind === undefined) {
            isBind = false; // eslint-disable-line no-param-reassign
        }
        answered = true;
        atLeastOneTextInputFound = false;
        oneTextInputFilled = false;
        el.find('input:text').each(function(i, textField) {
            if ($(textField).is(':visible')) {
                atLeastOneTextInputFound = true;
                if ($(textField).val() !== '') {
                    oneTextInputFilled = true;
                }
                if (isBind) {
                    $(textField).on('input', function() {
                        saveNotification.hide();
                        showAnswerNotification.hide();
                        submitAnswersAndSubmitButton();
                    });
                }
            }
        });
        if (atLeastOneTextInputFound && !oneTextInputFilled) {
            answered = false;
        }
        el.find('.choicegroup').each(function(i, choicegroupBlock) {
            var checked = false;
            $(choicegroupBlock).find('input[type=checkbox], input[type=radio]')
                .each(function(j, checkboxOrRadio) {
                    if ($(checkboxOrRadio).is(':checked')) {
                        checked = true;
                    }
                    if (isBind) {
                        $(checkboxOrRadio).on('click', function() {
                            saveNotification.hide();
                            el.find('.show').removeAttr('disabled');
                            showAnswerNotification.hide();
                            submitAnswersAndSubmitButton();
                        });
                    }
                });
            if (!checked) {
                answered = false;
            }
        });
        el.find('select').each(function(i, selectField) {
            var selectedOption = $(selectField).find('option:selected').text()
                .trim();
            if (selectedOption === 'Select an option') {
                answered = false;
            }
            if (isBind) {
                $(selectField).on('change', function() {
                    saveNotification.hide();
                    showAnswerNotification.hide();
                    submitAnswersAndSubmitButton();
                });
            }
        });
        if (answered) {
            return enableSubmitButton(true);
        } else {
            return enableSubmitButton(false, false);
        }
    }

    function submit_save_waitfor(callback) {
        var flag, inp, i, len, ref;
        flag = false;
        ref = inputs;
        for (i = 0, len = ref.length; i < len; i++) {
            inp = ref[i];
            if ($(inp).is('input[waitfor]')) {
                try {
                    $(inp).data('waitfor')(function() {
                        refreshAnswers();
                        return callback();
                    });
                } catch (e) {
                    if (e.name === 'Waitfor Exception') {
                        alert(e.message); // eslint-disable-line no-alert
                    } else {
                        alert( // eslint-disable-line no-alert
                            gettext('Could not grade your answer. The submission was aborted.')
                        );
                    }
                    throw e;
                }
                flag = true;
            } else {
                flag = false;
            }
        }
        return flag;
    }

    // --- InputType Specific Logic ---

    function setupInputTypes() {
        inputtypeDisplays = {};
        return el.find('.capa_inputtype').each(function(index, inputtype) {
            var classes, cls, id, setupMethod, i, len, results;
            classes = $(inputtype).attr('class').split(' ');
            id = $(inputtype).attr('id');
            results = [];
            for (i = 0, len = classes.length; i < len; i++) {
                cls = classes[i];
                setupMethod = inputtypeSetupMethods[cls];
                if (setupMethod != null) {
                    results.push(inputtypeDisplays[id] = setupMethod(inputtype));
                } else {
                    // eslint-disable-next-line no-void
                    results.push(void 0);
                }
            }
            return results;
        });
    }

    function bindResetCorrectness() {
        var $inputtypes;
        $inputtypes = el.find('.capa_inputtype').add(el.find('.inputtype'));
        return $inputtypes.each(function(index, inputtype) {
            var bindMethod, classes, cls, i, len, results;
            classes = $(inputtype).attr('class').split(' ');
            results = [];
            for (i = 0, len = classes.length; i < len; i++) {
                cls = classes[i];
                bindMethod = bindResetCorrectnessByInputtype[cls];
                if (bindMethod != null) {
                    results.push(bindMethod(inputtype));
                } else {
                    // eslint-disable-next-line no-void
                    results.push(void 0);
                }
            }
            return results;
        });
    }

    var bindResetCorrectnessByInputtype = {
        formulaequationinput: function(resetElement) {
            return $(resetElement).find('input').on('input', function() {
                var $p;
                $p = $(resetElement).find('span.status');
                $p.removeClass('correct incorrect submitted');
                return $p.parent().removeAttr('class').addClass('unsubmitted');
            });
        },
        choicegroup: function(resetElement) {
            var $element, id;
            $element = $(resetElement);
            id = ($element.attr('id').match(/^inputtype_(.*)$/))[1];
            return $element.find('input').on('change', function() {
                var $status;
                $status = $('#status_' + id);
                if ($status[0]) {
                    $status.removeAttr('class').addClass('status unanswered');
                } else {
                    $('<span>', {
                        class: 'status unanswered',
                        style: 'display: inline-block;',
                        id: 'status_' + id
                    });
                }
                $element.find('label').find('span.status.correct').remove();
                return $element.find('label').removeAttr('class');
            });
        },
        'option-input': function(resetElement) {
            var $select, id;
            $select = $(resetElement).find('select');
            id = ($select.attr('id').match(/^input_(.*)$/))[1];
            return $select.on('change', function() {
                return $('#status_' + id).removeAttr('class').addClass('unanswered')
                    .find('.sr')
                    .text(gettext('unsubmitted'));
            });
        },
        textline: function(resetElement) {
            return $(resetElement).find('input').on('input', function() {
                var $p;
                $p = $(resetElement).find('span.status');
                $p.removeClass('correct incorrect submitted');
                return $p.parent().removeClass('correct incorrect').addClass('unsubmitted');
            });
        }
    };

    var inputtypeSetupMethods = {
        'text-input-dynamath': function(setupElement) {
            var data, preprocessor, preprocessorClass, preprocessorClassName;
            data = $(setupElement).find('.text-input-dynamath_data');
            preprocessorClassName = data.data('preprocessor');
            preprocessorClass = window[preprocessorClassName];
            if (preprocessorClass == null) {
                return false;
            } else {
                preprocessor = new preprocessorClass();
                return preprocessor.fn;
            }
        },
        cminput: function(container) {
            var CodeMirrorEditor, CodeMirrorTextArea, cmElement, id, linenumbers, mode, spaces, tabsize;
            cmElement = $(container).find('textarea');
            tabsize = cmElement.data('tabsize');
            mode = cmElement.data('mode');
            linenumbers = cmElement.data('linenums');
            spaces = Array(parseInt(tabsize, 10) + 1).join(' ');
            CodeMirrorEditor = CodeMirror.fromTextArea(cmElement[0], {
                lineNumbers: linenumbers,
                indentUnit: tabsize,
                tabSize: tabsize,
                mode: mode,
                matchBrackets: true,
                lineWrapping: true,
                indentWithTabs: false,
                smartIndent: false,
                extraKeys: {
                    Esc: function() {
                        $('.grader-status').focus();
                        return false;
                    },
                    Tab: function(cm) {
                        cm.replaceSelection(spaces, 'end');
                        return false;
                    }
                }
            });
            id = cmElement.attr('id').replace(/^input_/, '');
            CodeMirrorTextArea = CodeMirrorEditor.getInputField();
            CodeMirrorTextArea.setAttribute('id', 'cm-textarea-' + id);
            CodeMirrorTextArea.setAttribute('aria-describedby', 'cm-editor-exit-message-' + id + ' status_' + id);
            return CodeMirrorEditor;
        }
    };

    var inputtypeShowAnswerMethods = {
        choicegroup: function(showElement, display, showAnswers, correctStatusHtml) {
            var answer, choice, inputId, i, len, results, $element, $inputLabel, $inputStatus;
            $element = $(showElement);
            inputId = $element.attr('id').replace(/inputtype_/, '');
            inputId = inputId.replace(':', '\\:');
            var safeId = inputId.replace(/\./g, '\\.');
            answer = showAnswers[inputId];
            results = [];
            for (i = 0, len = answer.length; i < len; i++) {
                choice = answer[i];
                $inputLabel = $element.find('#input_' + safeId + '_' + choice + ' + label');
                $inputStatus = $element.find('#status_' + safeId);
                if ($inputStatus.hasClass('unanswered')) {
                    edx.HtmlUtils.append($inputLabel, edx.HtmlUtils.HTML(correctStatusHtml));
                    $inputLabel.addClass('choicegroup_correct');
                } else if (!$inputLabel.hasClass('choicegroup_correct')) {
                    edx.HtmlUtils.append($inputLabel, edx.HtmlUtils.HTML(correctStatusHtml));
                    $inputLabel.removeClass('choicegroup_incorrect');
                    results.push($inputLabel.addClass('choicegroup_correct'));
                }
            }
            return results;
        },
        choicetextgroup: function(showElement, display, showAnswers) {
            var answer, choice, inputId, i, len, results, $element;
            $element = $(showElement);
            inputId = $element.attr('id').replace(/inputtype_/, '');
            answer = showAnswers[inputId];
            results = [];
            for (i = 0, len = answer.length; i < len; i++) {
                choice = answer[i];
                results.push($element.find('section#forinput' + choice).addClass('choicetextgroup_show_correct'));
            }
            return results;
        },
        imageinput: function(showElement, display, showAnswers) {
            var canvas, container, id, types, context, $element;
            types = {
                rectangle: function(ctx, coords) {
                    var rects, reg;
                    reg = /^\(([0-9]+),([0-9]+)\)-\(([0-9]+),([0-9]+)\)$/;
                    rects = coords.replace(/\s*/g, '').split(/;/);
                    $.each(rects, function(index, rect) {
                        var abs, height, points, width;
                        abs = Math.abs;
                        points = reg.exec(rect);
                        if (points) {
                            width = abs(points[3] - points[1]);
                            height = abs(points[4] - points[2]);
                            ctx.rect(points[1], points[2], width, height);
                        }
                    });
                    ctx.stroke();
                    return ctx.fill();
                },
                regions: function(ctx, coords) {
                    var parseCoords;
                    parseCoords = function(coordinates) {
                        var reg;
                        reg = JSON.parse(coordinates);
                        if (typeof reg[0][0][0] === 'undefined') {
                            reg = [reg];
                        }
                        return reg;
                    };
                    return $.each(parseCoords(coords), function(index, region) {
                        ctx.beginPath();
                        $.each(region, function(idx, point) {
                            if (idx === 0) {
                                return ctx.moveTo(point[0], point[1]);
                            } else {
                                return ctx.lineTo(point[0], point[1]);
                            }
                        });
                        ctx.closePath();
                        ctx.stroke();
                        return ctx.fill();
                    });
                }
            };
            $element = $(showElement);
            id = $element.attr('id').replace(/inputtype_/, '');
            container = $element.find('#answer_' + id);
            canvas = document.createElement('canvas');
            canvas.width = container.data('width');
            canvas.height = container.data('height');
            if (canvas.getContext) {
                context = canvas.getContext('2d');
            } else {
                console.log('Canvas is not supported.'); // eslint-disable-line no-console
            }
            context.fillStyle = 'rgba(255,255,255,.3)';
            context.strokeStyle = '#FF0000';
            context.lineWidth = '2';
            if (showAnswers[id]) {
                $.each(showAnswers[id], function(key, value) {
                    if ((types[key] !== null && types[key] !== undefined) && value) {
                        types[key](context, value);
                    }
                });
                edx.HtmlUtils.setHtml(container, edx.HtmlUtils.HTML(canvas));
            } else {
                console.log('Answer is absent for image input with id=' + id); // eslint-disable-line no-console
            }
        }
    };

    // --- Kick things off ---
    init();
}

/**
 * The original code defined `Problem.inputAjax` as a static method.
 * The requested refactoring pattern does not have a natural place for static methods
 * inside the main function body. To preserve this functionality without altering its
 * static nature, it is attached directly to the `Problem` function object here.
 *
 * Use this if you want to make an ajax call on the input type object
 *
 * Input:
 * url: the AJAX url of the problem
 * inputId: the inputId of the input you would like to make the call on
 * NOTE: the id is the ${id} part of "input_${id}" during rendering
 * If this function is passed the entire prefixed id, the backend may have trouble
 * finding the correct input
 * dispatch: string that indicates how this data should be handled by the inputtype
 * data: dictionary of data to send to the server
 * callback: the function that will be called once the AJAX call has been completed.
 * It will be passed a response object
 */
Problem.inputAjax = function(url, inputId, dispatch, data, callback) {
    data.dispatch = dispatch; // eslint-disable-line no-param-reassign
    data.input_id = inputId; // eslint-disable-line no-param-reassign
    return $.postWithPrefix('' + url + '/input_ajax', data, callback);
};