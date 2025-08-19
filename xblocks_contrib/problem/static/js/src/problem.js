/* global MathJax, Collapsible, interpolate, JavascriptLoader, Logger, CodeMirror, edx, ngettext, gettext */
// Note: this code was originally converted from CoffeeScript. Some warnings have been suppressed.
/* eslint max-len: ["error", 120, { "ignoreComments": true }] */

/**
 * A static utility function for making AJAX calls related to specific input types within a problem.
 * This does not require a Problem instance.
 *
 * @param {string} url - The base URL for the problem's AJAX endpoints.
 * @param {string} inputId - The unique ID of the input field (without the 'input_' prefix).
 * @param {string} dispatch - A string indicating the action for the backend to perform.
 * @param {object} data - The data payload to send.
 * @param {function} callback - The function to execute upon a successful response.
 */
function problemInputAjax(url, inputId, dispatch, data, callback) {
    'use strict';
    const postData = { ...data, dispatch, input_id: inputId };
    return $.postWithPrefix(`${url}/input_ajax`, postData, callback);
}

function Problem(runtime, element) {
    'use strict';

    // --- Initialization and Scope Setup ---
    const problemWrapper = $(element);
    if (problemWrapper.attr('data-problem-processed') === 'true') {
        return;
    }
    problemWrapper.attr('data-problem-processed', 'true');

    // --- Local variables scoped to this instance ---
    const el = problemWrapper.find('.problems-wrapper');
    const id = el.data('problem-id');
    const element_id = el.attr('id');
    const url = el.data('url');
    const content = el.data('content');

    // State tracking
    let has_timed_out = false;
    let has_response = false;
    let answers = {};
    let inputs = null;
    let inputtypeDisplays = {};

    // Element references
    let submitButton, submitButtonLabel, submitButtonSubmitText, submitButtonSubmittingText,
        hintButton, resetButton, showButton, saveButton, reviewButton,
        saveNotification, showAnswerNotification, gentleAlertNotification, submitNotification;

    // --- Helper Functions ---

    /**
     * A scoped jQuery-like selector that searches within this problem's main element.
     * @param {string} selector - A jQuery selector.
     * @returns {jQuery} The jQuery object for the matched elements.
     */
    const $ = (selector) => el.find(selector);

    // --- Core Logic Functions (formerly prototype methods) ---

    function render(newContent, focusCallback) {
        if (newContent) {
            edx.HtmlUtils.setHtml(el, edx.HtmlUtils.HTML(newContent));
            return JavascriptLoader.executeModuleScripts(el, () => {
                setupInputTypes();
                bind();
                queueing(focusCallback);
                renderProgressState();
                if (typeof focusCallback === 'function') {
                    focusCallback();
                }
            });
        }
        return $.postWithPrefix(`${url}/problem_get`, (response) => {
            edx.HtmlUtils.setHtml(el, edx.HtmlUtils.HTML(response.html));
            return JavascriptLoader.executeModuleScripts(el, () => {
                setupInputTypes();
                bind();
                queueing();
                forceUpdate(response);
            });
        });
    }

    function bind() {
        if (typeof MathJax !== 'undefined' && MathJax !== null) {
            $('.problem > div').each((index, mathElement) => MathJax.Hub.Queue(['Typeset', MathJax.Hub, mathElement]));
        }
        if (window.hasOwnProperty('update_schematics')) {
            window.update_schematics();
        }

        const problemPrefix = element_id.replace(/problem_/, '');
        inputs = $(`[id^="input_${problemPrefix}_"]`);

        // Bind buttons
        $('div.action button').click(refreshAnswers);
        reviewButton = $('.notification-btn.review-btn');
        reviewButton.click(scroll_to_problem_meta);
        submitButton = $('.action .submit');
        submitButtonLabel = $('.action .submit .submit-label');
        submitButtonSubmitText = submitButtonLabel.text();
        submitButtonSubmittingText = submitButton.data('submitting');
        submitButton.click(submit_fd);
        hintButton = $('.action .hint-button');
        hintButton.click(hint_button);
        resetButton = $('.action .reset');
        resetButton.click(reset);
        showButton = $('.action .show');
        showButton.click(show);
        saveButton = $('.action .save');
        saveButton.click(save);

        // Bind notifications
        saveNotification = $('.notification-save');
        showAnswerNotification = $('.notification-show-answer');
        gentleAlertNotification = $('.notification-gentle-alert');
        submitNotification = $('.notification-submit');

        // Accessibility bindings
        $('.clarification').focus((ev) => window.globalTooltipManager.openTooltip($(ev.target).children('i')));
        $('.clarification').blur(() => window.globalTooltipManager.hide());
        $('.review-btn').focus((ev) => $(ev.target).removeClass('sr')).blur((ev) => $(ev.target).addClass('sr'));

        bindResetCorrectness();
        if (submitButton.length) {
            submitAnswersAndSubmitButton(true);
        }
        Collapsible.setCollapsibles(el);
        $('input.math').keyup(refreshMath);
        if (typeof MathJax !== 'undefined' && MathJax !== null) {
            $('input.math').each((index, mathElement) => MathJax.Hub.Queue([refreshMath, null, mathElement]));
        }
    }

    function renderProgressState() {
        const curScore = el.data('problem-score');
        const totalScore = el.data('problem-total-possible');
        const attemptsUsed = el.data('attempts-used');
        let isGraded = el.data('graded') === 'True' && totalScore !== 0;
        let progressTemplate;

        if (curScore === undefined || totalScore === undefined) {
            progressTemplate = '';
        } else if (curScore === null || curScore === 'None') {
            const msg = isGraded
                ? ngettext('{num_points} point possible (graded, results hidden)', '{num_points} points possible (graded, results hidden)', totalScore)
                : ngettext('{num_points} point possible (ungraded, results hidden)', '{num_points} points possible (ungraded, results hidden)', totalScore);
            progressTemplate = msg;
        } else if ((attemptsUsed === 0 || totalScore === 0) && curScore === 0) {
            const msg = isGraded
                ? ngettext('{num_points} point possible (graded)', '{num_points} points possible (graded)', totalScore)
                : ngettext('{num_points} point possible (ungraded)', '{num_points} points possible (ungraded)', totalScore);
            progressTemplate = msg;
        } else {
            const msg = isGraded
                ? ngettext('{earned}/{possible} point (graded)', '{earned}/{possible} points (graded)', totalScore)
                : ngettext('{earned}/{possible} point (ungraded)', '{earned}/{possible} points (ungraded)', totalScore);
            progressTemplate = msg;
        }

        const progress = edx.StringUtils.interpolate(progressTemplate, {
            earned: curScore,
            num_points: totalScore,
            possible: totalScore,
        });

        $('.problem-progress').text(progress);
    }

    function updateProgress(response) {
        if (response.progress_changed) {
            el.data('problem-score', response.current_score);
            el.data('problem-total-possible', response.total_possible);
            el.data('attempts-used', response.attempts_used);
            el.trigger('progressChanged');
        }
        renderProgressState();
    }

    function forceUpdate(response) {
        el.data('problem-score', response.current_score);
        el.data('problem-total-possible', response.total_possible);
        el.data('attempts-used', response.attempts_used);
        el.trigger('progressChanged');
        renderProgressState();
    }

    function queueing(focusCallback) {
        if ($('.xqueue').length > 0) {
            if (window.queuePollerID) {
                window.clearTimeout(window.queuePollerID);
            }
            window.queuePollerID = window.setTimeout(() => poll(1000, focusCallback), 1000);
        }
    }

    function poll(previousTimeout, focusCallback) {
        $.postWithPrefix(`${url}/problem_get`, (response) => {
            const newQueuedItems = $(response.html).find('.xqueue');
            if (newQueuedItems.length !== $('.xqueue').length) {
                edx.HtmlUtils.setHtml(el, edx.HtmlUtils.HTML(response.html)).promise().done(() => {
                    if (typeof focusCallback === 'function') {
                        focusCallback();
                    }
                });
                JavascriptLoader.executeModuleScripts(el, () => {
                    setupInputTypes();
                    bind();
                });
            }

            if (newQueuedItems.length === 0) {
                forceUpdate(response);
                delete window.queuePollerID;
            } else {
                const newTimeout = previousTimeout * 2;
                if (newTimeout >= 60000) {
                    delete window.queuePollerID;
                    gentle_alert(gettext('The grading process is still running. Refresh the page to see updates.'));
                } else {
                    window.queuePollerID = window.setTimeout(() => poll(newTimeout, focusCallback), newTimeout);
                }
            }
        });
    }

    function setupInputTypes() {
        inputtypeDisplays = {};
        el.find('.capa_inputtype').each((index, inputtype) => {
            const classes = $(inputtype).attr('class').split(' ');
            const inputId = $(inputtype).attr('id');
            classes.forEach((cls) => {
                const setupMethod = inputtypeSetupMethods[cls];
                if (setupMethod) {
                    inputtypeDisplays[inputId] = setupMethod(inputtype);
                }
            });
        });
    }

    function submit_save_waitfor(callback) {
        let flag = false;
        inputs.each((i, inp) => {
            if ($(inp).is('input[waitfor]')) {
                try {
                    $(inp).data('waitfor')(() => {
                        refreshAnswers();
                        return callback();
                    });
                } catch (e) {
                    const message = e.name === 'Waitfor Exception'
                        ? e.message
                        : gettext('Could not grade your answer. The submission was aborted.');
                    alert(message); // eslint-disable-line no-alert
                    throw e;
                }
                flag = true;
            }
        });
        return flag;
    }

    function scroll_to_problem_meta() {
        const questionTitle = $('.problem-header');
        if (questionTitle.length > 0) {
            $('html, body').animate({ scrollTop: questionTitle.offset().top }, 500);
            questionTitle.focus();
        }
    }

    function focus_on_notification(type) {
        const notification = $(`.notification-${type}`);
        if (notification.length > 0) {
            notification.focus();
        }
    }

    const focus_on_submit_notification = () => focus_on_notification('submit');
    const focus_on_save_notification = () => focus_on_notification('save');
    const focus_on_hint_notification = (hintIndex) => $(`.notification-hint .notification-message > ol > li.hint-index-${hintIndex}`).focus();

    function submit_fd() {
        if (el.find('input:file').length === 0) {
            submit();
            return;
        }

        enableSubmitButton(false);
        if (!window.FormData) {
            alert(gettext('Submission aborted! Sorry, your browser does not support file uploads. If you can, please use Chrome or Safari which have been verified to support file uploads.')); // eslint-disable-line no-alert
            enableSubmitButton(true);
            return;
        }

        const timeoutId = enableSubmitButtonAfterTimeout();
        const fd = new FormData();
        const maxFileSize = 4 * 1000 * 1000;
        const errors = [];
        let fileNotSelected = false;

        inputs.each((index, element) => {
            if (element.type === 'file') {
                const requiredFiles = $(element).data('required_files') || [];
                const allowedFiles = $(element).data('allowed_files') || [];

                if (element.files.length === 0) {
                    fileNotSelected = true;
                }

                Array.from(element.files).forEach((file) => {
                    if (allowedFiles.length && !allowedFiles.includes(file.name)) {
                        errors.push(edx.StringUtils.interpolate(gettext('You submitted {filename}; only {allowedFiles} are allowed.'), { filename: file.name, allowedFiles }));
                    }
                    const reqIndex = requiredFiles.indexOf(file.name);
                    if (reqIndex >= 0) {
                        requiredFiles.splice(reqIndex, 1);
                    }
                    if (file.size > maxFileSize) {
                        errors.push(edx.StringUtils.interpolate(gettext('Your file {filename} is too large (max size: {maxSize}MB).'), { filename: file.name, maxSize: maxFileSize / 1e6 }));
                    }
                    fd.append(element.id, file);
                });

                if (requiredFiles.length) {
                    errors.push(edx.StringUtils.interpolate(gettext('You did not submit the required files: {requiredFiles}.'), { requiredFiles }));
                }
            } else {
                fd.append(element.id, element.value);
            }
        });

        if (fileNotSelected) {
            errors.push(gettext('You did not select any files to submit.'));
        }

        if (errors.length) {
            let errorHtml = edx.HtmlUtils.HTML('');
            errors.forEach(error => {
                errorHtml = edx.HtmlUtils.joinHtml(errorHtml, edx.HtmlUtils.interpolateHtml(edx.HtmlUtils.HTML('<li>{error}</li>'), { error }));
            });
            gentle_alert(edx.HtmlUtils.interpolateHtml(edx.HtmlUtils.HTML('<ul>{errors}</ul>'), { errors: errorHtml }).toString());
            window.clearTimeout(timeoutId);
            enableSubmitButton(true);
        } else {
            const settings = {
                type: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                complete: enableSubmitButtonAfterResponse,
                success: (response) => {
                    if (['submitted', 'incorrect', 'correct'].includes(response.success)) {
                        render(response.contents);
                        updateProgress(response);
                    } else {
                        gentle_alert(response.success);
                    }
                    Logger.log('problem_graded', [answers, response.contents], id);
                },
                error: (response) => gentle_alert(response.responseJSON.success),
            };
            $.ajaxWithPrefix(`${url}/problem_check`, settings);
        }
    }

    function submit() {
        if (!submit_save_waitfor(submit_internal)) {
            disableAllButtonsWhileRunning(submit_internal, true);
        }
    }

    function submit_internal() {
        Logger.log('problem_check', answers);
        return $.postWithPrefix(`${url}/problem_check`, answers, (response) => {
            if (['submitted', 'incorrect', 'correct'].includes(response.success)) {
                window.SR.readTexts(get_sr_status(response.contents));
                el.trigger('contentChanged', [id, response.contents, response]);
                render(response.contents, focus_on_submit_notification);
                updateProgress(response);
                if (response.entrance_exam_passed) {
                    window.parent.postMessage({ type: 'entranceExam.passed' }, '*');
                }
            } else {
                saveNotification.hide();
                gentle_alert(response.success);
            }
            Logger.log('problem_graded', [answers, response.contents], id);
        });
    }

    function get_sr_status(contents) {
        const labeledStatus = [];
        $(contents).find('.status').each((i, element) => {
            const parentSection = $(element).closest('.wrapper-problem-response');
            const ariaLabel = parentSection.attr('aria-label');
            if (ariaLabel) {
                const template = gettext('{label}: {status}');
                labeledStatus.push(edx.StringUtils.interpolate(template, { label: ariaLabel, status: $(element).text() }));
            } else {
                labeledStatus.push($(element).text());
            }
        });
        return labeledStatus;
    }

    function reset() {
        return disableAllButtonsWhileRunning(reset_internal, false);
    }

    function reset_internal() {
        Logger.log('problem_reset', answers);
        return $.postWithPrefix(`${url}/problem_reset`, { id }, (response) => {
            if (response.success) {
                el.trigger('contentChanged', [id, response.html, response]);
                render(response.html, scroll_to_problem_meta);
                updateProgress(response);
                window.SR.readText(gettext('This problem has been reset.'));
            } else {
                gentle_alert(response.msg);
            }
        });
    }

    function show() {
        Logger.log('problem_show', { problem: id });
        return $.postWithPrefix(`${url}/problem_show`, (response) => {
            const responseAnswers = response.answers;
            $.each(responseAnswers, (key, value) => {
                const safeKey = key.replace(/:/g, '\\:').replace(/\./g, '\\.');
                if (!$.isArray(value)) {
                    const answerEl = $(`#answer_${safeKey}, #solution_${safeKey}`);
                    edx.HtmlUtils.setHtml(answerEl, edx.HtmlUtils.HTML(value));
                    Collapsible.setCollapsibles(answerEl);
                }
            });

            el.find('.capa_inputtype').each((index, inputtype) => {
                const classes = $(inputtype).attr('class').split(' ');
                classes.forEach((cls) => {
                    const display = inputtypeDisplays[$(inputtype).attr('id')];
                    const showMethod = inputtypeShowAnswerMethods[cls];
                    if (showMethod) {
                        showMethod(inputtype, display, responseAnswers, response.correct_status_html);
                    }
                });
            });

            if (typeof MathJax !== 'undefined' && MathJax !== null) {
                $('.problem > div').each((index, element) => MathJax.Hub.Queue(['Typeset', MathJax.Hub, element]));
            }
            $('.show').attr('disabled', 'disabled');
            updateProgress(response);
            clear_all_notifications();
            showAnswerNotification.show();
            focus_on_notification('show-answer');
        });
    }

    function clear_all_notifications() {
        if (submitNotification) submitNotification.remove();
        if (gentleAlertNotification) gentleAlertNotification.hide();
        if (saveNotification) saveNotification.hide();
        if (showAnswerNotification) showAnswerNotification.hide();
    }

    function gentle_alert(msg) {
        edx.HtmlUtils.setHtml($('.notification-gentle-alert .notification-message'), edx.HtmlUtils.HTML(msg));
        clear_all_notifications();
        gentleAlertNotification.show();
        gentleAlertNotification.focus();
    }

    function save() {
        if (!submit_save_waitfor(save_internal)) {
            disableAllButtonsWhileRunning(save_internal, false);
        }
    }

    function save_internal() {
        Logger.log('problem_save', answers);
        return $.postWithPrefix(`${url}/problem_save`, answers, (response) => {
            if (response.success) {
                el.trigger('contentChanged', [id, response.html, response]);
                edx.HtmlUtils.setHtml($('.notification-save .notification-message'), edx.HtmlUtils.HTML(response.msg));
                clear_all_notifications();
                $('.wrapper-problem-response .message').hide();
                saveNotification.show();
                focus_on_save_notification();
            } else {
                gentle_alert(response.msg);
            }
        });
    }

    function refreshMath(event, element) {
        const targetElement = element || event.target;
        const elid = targetElement.id.replace(/^input_/, '');
        const target = `display_${elid}`;
        const preprocessorTag = `inputtype_${elid}`;
        const mathjaxPreprocessor = inputtypeDisplays[preprocessorTag];

        if (typeof MathJax !== 'undefined' && MathJax !== null && MathJax.Hub.getAllJax(target)[0]) {
            const jax = MathJax.Hub.getAllJax(target)[0];
            let eqn = $(targetElement).val();
            if (mathjaxPreprocessor) {
                eqn = mathjaxPreprocessor(eqn);
            }
            MathJax.Hub.Queue(['Text', jax, eqn], [updateMathML, jax, targetElement]);
        }
    }

    function updateMathML(jax, element) {
        try {
            $(`#${element.id}_dynamath`).val(jax.root.toMathML(''));
        } catch (exception) {
            if (!exception.restart) {
                throw exception;
            }
            if (typeof MathJax !== 'undefined' && MathJax !== null) {
                MathJax.Callback.After([refreshMath, jax], exception.restart);
            }
        }
    }

    function refreshAnswers() {
        $('input.schematic').each((index, element) => {
            if (element.schematic) element.schematic.update_value();
        });
        $('.CodeMirror').each((index, element) => {
            if (element.CodeMirror && element.CodeMirror.save) {
                element.CodeMirror.save();
            }
        });
        answers = inputs.serialize();
    }

    function submitAnswersAndSubmitButton(isInitialBind = false) {
        let isAnswered = true;
        let atLeastOneTextInputFound = false;
        let oneTextInputFilled = false;

        el.find('input:text').each((i, textField) => {
            if ($(textField).is(':visible')) {
                atLeastOneTextInputFound = true;
                if ($(textField).val() !== '') {
                    oneTextInputFilled = true;
                }
                if (isInitialBind) {
                    $(textField).on('input', () => {
                        saveNotification.hide();
                        showAnswerNotification.hide();
                        submitAnswersAndSubmitButton();
                    });
                }
            }
        });
        if (atLeastOneTextInputFound && !oneTextInputFilled) {
            isAnswered = false;
        }

        el.find('.choicegroup').each((i, choicegroupBlock) => {
            let isChecked = false;
            $(choicegroupBlock).find('input[type=checkbox], input[type=radio]').each((j, checkboxOrRadio) => {
                if ($(checkboxOrRadio).is(':checked')) {
                    isChecked = true;
                }
                if (isInitialBind) {
                    $(checkboxOrRadio).on('click', () => {
                        saveNotification.hide();
                        $('.show').removeAttr('disabled');
                        showAnswerNotification.hide();
                        submitAnswersAndSubmitButton();
                    });
                }
            });
            if (!isChecked) {
                isAnswered = false;
            }
        });

        el.find('select').each((i, selectField) => {
            if ($(selectField).find('option:selected').text().trim() === 'Select an option') {
                isAnswered = false;
            }
            if (isInitialBind) {
                $(selectField).on('change', () => {
                    saveNotification.hide();
                    showAnswerNotification.hide();
                    submitAnswersAndSubmitButton();
                });
            }
        });

        enableSubmitButton(isAnswered, false);
    }

    function bindResetCorrectness() {
        const $inputtypes = el.find('.capa_inputtype, .inputtype');
        $inputtypes.each((index, inputtype) => {
            const classes = $(inputtype).attr('class').split(' ');
            classes.forEach((cls) => {
                const bindMethod = bindResetCorrectnessByInputtype[cls];
                if (bindMethod) {
                    bindMethod(inputtype);
                }
            });
        });
    }

    function enableButtons(buttons, enable, changeSubmitButtonText) {
        buttons.forEach((button) => {
            if (!button) return;
            if (button.hasClass('submit')) {
                enableSubmitButton(enable, changeSubmitButtonText);
            } else if (enable) {
                button.removeAttr('disabled');
            } else {
                button.attr({ disabled: 'disabled' });
            }
        });
    }

    function disableAllButtonsWhileRunning(operationCallback, isFromCheckOperation) {
        const allButtons = [resetButton, saveButton, showButton, hintButton, submitButton];
        const initiallyEnabledButtons = allButtons.filter(button => button && !button.attr('disabled'));
        enableButtons(initiallyEnabledButtons, false, isFromCheckOperation);
        return operationCallback().always(() => enableButtons(initiallyEnabledButtons, true, isFromCheckOperation));
    }

    function enableSubmitButton(enable, changeText = true) {
        if (enable) {
            const submitCanBeEnabled = submitButton.data('should-enable-submit-button') === 'True';
            if (submitCanBeEnabled) {
                submitButton.removeAttr('disabled');
            }
            if (changeText) {
                submitButtonLabel.text(submitButtonSubmitText);
            }
        } else {
            submitButton.attr({ disabled: 'disabled' });
            if (changeText) {
                submitButtonLabel.text(submitButtonSubmittingText);
            }
        }
    }

    function enableSubmitButtonAfterResponse() {
        has_response = true;
        if (!has_timed_out) {
            enableSubmitButton(false);
        } else {
            enableSubmitButton(true);
        }
    }

    function enableSubmitButtonAfterTimeout() {
        has_timed_out = false;
        has_response = false;
        const enable = () => {
            has_timed_out = true;
            if (has_response) {
                enableSubmitButton(true);
            }
        };
        return window.setTimeout(enable, 750);
    }

    function hint_button() {
        const hintContainer = $('.problem-hint');
        const hintIndex = hintContainer.attr('hint_index');
        const nextIndex = hintIndex === undefined ? 0 : parseInt(hintIndex, 10) + 1;

        return $.postWithPrefix(`${url}/hint_button`, { hint_index: nextIndex, input_id: id }, (response) => {
            if (response.success) {
                const hintMsgContainer = $('.problem-hint .notification-message');
                hintContainer.attr('hint_index', response.hint_index);
                edx.HtmlUtils.setHtml(hintMsgContainer, edx.HtmlUtils.HTML(response.msg));
                MathJax.Hub.Queue(['Typeset', MathJax.Hub, hintContainer[0]]);
                if (response.should_enable_next_hint) {
                    hintButton.removeAttr('disabled');
                } else {
                    hintButton.attr({ disabled: 'disabled' });
                }
                el.find('.notification-hint').show();
                focus_on_hint_notification(nextIndex);
            } else {
                gentle_alert(response.msg);
            }
        });
    }

    // --- Helper Objects for Input Types ---

    const bindResetCorrectnessByInputtype = {
        formulaequationinput: (element) => {
            $(element).find('input').on('input', () => {
                const $p = $(element).find('span.status');
                $p.removeClass('correct incorrect submitted');
                $p.parent().removeAttr('class').addClass('unsubmitted');
            });
        },
        choicegroup: (element) => {
            const $element = $(element);
            const choiceId = ($element.attr('id').match(/^inputtype_(.*)$/))[1];
            $element.find('input').on('change', () => {
                const $status = $(`#status_${choiceId}`);
                if ($status.length) {
                    $status.removeAttr('class').addClass('status unanswered');
                }
                $element.find('label').find('span.status.correct').remove();
                $element.find('label').removeAttr('class');
            });
        },
        'option-input': (element) => {
            const $select = $(element).find('select');
            const selectId = ($select.attr('id').match(/^input_(.*)$/))[1];
            $select.on('change', () => $(`#status_${selectId}`).removeAttr('class').addClass('unanswered').find('.sr').text(gettext('unsubmitted')));
        },
        textline: (element) => {
            $(element).find('input').on('input', () => {
                const $p = $(element).find('span.status');
                $p.removeClass('correct incorrect submitted');
                $p.parent().removeClass('correct incorrect').addClass('unsubmitted');
            });
        },
    };

    const inputtypeSetupMethods = {
        'text-input-dynamath': (element) => {
            const data = $(element).find('.text-input-dynamath_data');
            const preprocessorClassName = data.data('preprocessor');
            const preprocessorClass = window[preprocessorClassName];
            if (!preprocessorClass) {
                return false;
            }
            const preprocessor = new preprocessorClass();
            return preprocessor.fn;
        },
        cminput: (container) => {
            const element = $(container).find('textarea');
            const tabsize = element.data('tabsize');
            const mode = element.data('mode');
            const linenumbers = element.data('linenums');
            const spaces = ' '.repeat(parseInt(tabsize, 10));

            const editor = CodeMirror.fromTextArea(element[0], {
                lineNumbers: linenumbers,
                indentUnit: tabsize,
                tabSize: tabsize,
                mode,
                matchBrackets: true,
                lineWrapping: true,
                indentWithTabs: false,
                smartIndent: false,
                extraKeys: {
                    Esc: () => {
                        $('.grader-status').focus();
                        return false;
                    },
                    Tab: (cm) => {
                        cm.replaceSelection(spaces, 'end');
                        return false;
                    },
                },
            });
            const editorId = element.attr('id').replace(/^input_/, '');
            const textArea = editor.getInputField();
            textArea.setAttribute('id', `cm-textarea-${editorId}`);
            textArea.setAttribute('aria-describedby', `cm-editor-exit-message-${editorId} status_${editorId}`);
            return editor;
        },
    };

    const inputtypeShowAnswerMethods = {
        choicegroup: (element, display, responseAnswers, correctStatusHtml) => {
            const $element = $(element);
            let inputId = $element.attr('id').replace(/inputtype_/, '');
            inputId = inputId.replace(/:/g, '\\:');
            const safeId = inputId.replace(/\./g, '\\.');
            const answer = responseAnswers[inputId];
            if (answer) {
                answer.forEach((choice) => {
                    const $inputLabel = $element.find(`#input_${safeId}_${choice} + label`);
                    const $inputStatus = $element.find(`#status_${safeId}`);
                    if ($inputStatus.hasClass('unanswered') || !$inputLabel.hasClass('choicegroup_correct')) {
                        edx.HtmlUtils.append($inputLabel, edx.HtmlUtils.HTML(correctStatusHtml));
                        $inputLabel.removeClass('choicegroup_incorrect').addClass('choicegroup_correct');
                    }
                });
            }
        },
        // Other show answer methods would go here...
    };


    // --- Initial Execution ---
    (function initialize() {
        render(content);
    })();
}