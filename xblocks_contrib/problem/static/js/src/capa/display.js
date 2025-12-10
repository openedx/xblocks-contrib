/* global MathJax, Collapsible, JavascriptLoader, Logger, CodeMirror, ngettext, gettext, edx */

/**
 * XBlock JavaScript entry point.
 *
 * This function initializes the problem XBlock by creating an instance of the ProblemHandler class,
 * which encapsulates all the logic for rendering, interaction, and server communication.
 *
 * @param {object} runtime - The XBlock runtime object.
 * @param {HTMLElement} element - The DOM element for this XBlock instance.
 */
function Problem(runtime, element) {
    'use strict';

    class ProblemHandler {
        /**
         * The main class for handling CAPA problem interactions.
         * @param {object} runtime - The XBlock runtime.
         * @param {HTMLElement} containingElement - The container element for the XBlock.
         */
        constructor(runtime, containingElement) {
            this.runtime = runtime;
            this.el = $(containingElement).find('.problems-wrapper');
            this.id = this.el.data('problem-id');
            this.element_id = this.el.attr('id');
            this.url = this.el.data('url');
            this.content = this.el.data('content');

            this.has_timed_out = false;
            this.has_response = false;

            this.inputtypeDisplays = {};
            this.answers = '';

            // This call initiates the rendering of the problem content.
            this.render(this.content);
        }

        /**
         * Static method for making AJAX calls related to specific input types.
         * @param {string} url - The base URL for the problem's AJAX calls.
         * @param {string} inputId - The ID of the input type.
         * @param {string} dispatch - The handler to be called on the server.
         * @param {object} data - The payload to send.
         * @param {function} callback - The function to execute upon completion.
         * @returns {jqXHR} - The jQuery AJAX request object.
         */
        static inputAjax(url, inputId, dispatch, data, callback) {
            const payload = {
                ...data,
                dispatch,
                input_id: inputId,
            };
            return $.postWithPrefix(`${url}/input_ajax`, payload, callback);
        }

        /**
         * A jQuery-like selector scoped to the problem's root element.
         * @param {string} selector - A CSS selector string.
         * @returns {jQuery} - A jQuery object representing the matched elements.
         */
        $(selector) {
            return this.el.find(selector);
        }

        /**
         * Binds all event handlers for the problem's interactive elements.
         */
        bind = () => {
            // Typeset mathematical content if MathJax is available.
            if (window.MathJax) {
                this.$('.problem > div').each((index, el) => {
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, el]);
                });
                this.$('input.math').each((index, el) => {
                    MathJax.Hub.Queue([this.refreshMath, null, el]);
                });
            }

            // Update schematics if the function exists globally.
            if (window.update_schematics) {
                window.update_schematics();
            }

            const problemPrefix = this.element_id.replace(/problem_/, '');
            this.inputs = this.$(`[id^="input_${problemPrefix}_"]`);

            // --- Bind Buttons ---
            this.$('div.action button').on('click', this.refreshAnswers);
            this.reviewButton = this.$('.notification-btn.review-btn');
            this.reviewButton.on('click', this.scroll_to_problem_meta);

            this.submitButton = this.$('.action .submit');
            this.submitButtonLabel = this.$('.action .submit .submit-label');
            this.submitButtonSubmitText = this.submitButtonLabel.text();
            this.submitButtonSubmittingText = this.submitButton.data('submitting');
            this.submitButton.on('click', this.submit_fd);

            this.hintButton = this.$('.action .hint-button');
            this.hintButton.on('click', this.hint_button);

            this.resetButton = this.$('.action .reset');
            this.resetButton.on('click', this.reset);

            this.showButton = this.$('.action .show');
            this.showButton.on('click', this.show);

            this.saveButton = this.$('.action .save');
            this.saveButton.on('click', this.save);

            // --- Cache Notification Elements ---
            this.saveNotification = this.$('.notification-save');
            this.showAnswerNotification = this.$('.notification-show-answer');
            this.gentleAlertNotification = this.$('.notification-gentle-alert');
            this.submitNotification = this.$('.notification-submit');

            // --- Accessibility and UI Bindings ---
            this.$('.clarification').on('focus', function () {
                const icon = $(this).children('i');
                window.globalTooltipManager.openTooltip(icon);
            }).on('blur', () => {
                window.globalTooltipManager.hide();
            });

            this.$('.review-btn').on('focus', function () {
                $(this).removeClass('sr');
            }).on('blur', function () {
                $(this).addClass('sr');
            });

            this.bindResetCorrectness();

            if (this.submitButton.length) {
                this.submitAnswersAndSubmitButton(true);
            }

            Collapsible.setCollapsibles(this.el);
            this.$('input.math').on('keyup', this.refreshMath);
        };

        /**
         * Renders the problem's progress (e.g., "1/2 points").
         */
        renderProgressState = () => {
            const curScore = this.el.data('problem-score');
            const totalScore = this.el.data('problem-total-possible');
            const attemptsUsed = this.el.data('attempts-used');
            let graded = this.el.data('graded') === 'True' && totalScore !== 0;

            let progressTemplate = '';

            if (curScore !== undefined && totalScore !== undefined) {
                if (curScore === null || curScore === 'None') {
                    progressTemplate = graded ?
                        ngettext('{num_points} point possible (graded, results hidden)', '{num_points} points possible (graded, results hidden)', totalScore) :
                        ngettext('{num_points} point possible (ungraded, results hidden)', '{num_points} points possible (ungraded, results hidden)', totalScore);
                } else if ((attemptsUsed === 0 || totalScore === 0) && curScore === 0) {
                    progressTemplate = graded ?
                        ngettext('{num_points} point possible (graded)', '{num_points} points possible (graded)', totalScore) :
                        ngettext('{num_points} point possible (ungraded)', '{num_points} points possible (ungraded)', totalScore);
                } else {
                    progressTemplate = graded ?
                        ngettext('{earned}/{possible} point (graded)', '{earned}/{possible} points (graded)', totalScore) :
                        ngettext('{earned}/{possible} point (ungraded)', '{earned}/{possible} points (ungraded)', totalScore);
                }
            }

            const progress = edx.StringUtils.interpolate(
                progressTemplate, { earned: curScore, num_points: totalScore, possible: totalScore }
            );

            this.$('.problem-progress').text(progress);
        };

        /**
         * Updates the problem's progress data and re-renders the progress display.
         * @param {object} response - The server response containing progress data.
         */
        updateProgress = (response) => {
            if (response.progress_changed) {
                this.el.data('problem-score', this.convertToFloat(response.current_score));
                this.el.data('problem-total-possible', this.convertToFloat(response.total_possible));
                this.el.data('attempts-used', response.attempts_used);
                this.el.trigger('progressChanged');
            }
            this.renderProgressState();
        };

        /**
         * Converts an integer to a float with one decimal place for consistent display.
         * @param {number|any} num - The number to convert.
         * @returns {string|any} - The formatted number or the original value.
         */
        convertToFloat = (num) => {
            if (typeof num === 'number' && Number.isInteger(num)) {
                return num.toFixed(1);
            }
            return num;
        };

        /**
         * Forcefully updates progress data from a response.
         * @param {object} response - The server response containing progress data.
         */
        forceUpdate = (response) => {
            this.el.data('problem-score', response.current_score);
            this.el.data('problem-total-possible', response.total_possible);
            this.el.data('attempts-used', response.attempts_used);
            this.el.trigger('progressChanged');
            this.renderProgressState();
        };

        /**
         * Initializes polling for problems that are being graded externally (e.g., in a queue).
         * @param {function} focusCallback - A callback to execute after polling updates the content.
         */
        queueing = (focusCallback) => {
            this.queued_items = this.$('.xqueue');
            this.num_queued_items = this.queued_items.length;
            if (this.num_queued_items > 0) {
                if (window.queuePollerID) {
                    window.clearTimeout(window.queuePollerID);
                }
                window.queuePollerID = window.setTimeout(() => this.poll(1000, focusCallback), 1000);
            }
        };

        /**
         * Polls the server for updates on queued submissions.
         * @param {number} previousTimeout - The previous timeout duration for exponential backoff.
         * @param {function} focusCallback - A callback to run after content updates.
         */
        poll = (previousTimeout, focusCallback) => {
            $.postWithPrefix(`${this.url}/problem_get`, (response) => {
                this.new_queued_items = $(response.html).find('.xqueue');
                if (this.new_queued_items.length !== this.num_queued_items) {
                    edx.HtmlUtils.setHtml(this.el, edx.HtmlUtils.HTML(response.html)).promise().done(() => {
                        focusCallback?.();
                    });
                    JavascriptLoader.executeModuleScripts(this.el, () => {
                        this.setupInputTypes();
                        this.bind();
                    });
                }

                this.num_queued_items = this.new_queued_items.length;
                if (this.num_queued_items === 0) {
                    this.forceUpdate(response);
                    delete window.queuePollerID;
                } else {
                    const newTimeout = previousTimeout * 2;
                    if (newTimeout >= 60000) { // 1 minute
                        delete window.queuePollerID;
                        this.gentle_alert(gettext('The grading process is still running. Refresh the page to see updates.'));
                    } else {
                        window.queuePollerID = window.setTimeout(() => this.poll(newTimeout, focusCallback), newTimeout);
                    }
                }
            });
        };

        /**
         * Renders the problem's HTML content and binds associated JavaScript.
         * @param {string} content - The HTML content to render.
         * @param {function} focusCallback - A callback to run after rendering.
         */
        render = (content, focusCallback) => {
            if (content) {
                edx.HtmlUtils.setHtml(this.el, edx.HtmlUtils.HTML(content));
                JavascriptLoader.executeModuleScripts(this.el, () => {
                    this.setupInputTypes();
                    this.bind();
                    this.queueing(focusCallback);
                    this.renderProgressState();
                    focusCallback?.();
                });
            } else {
                $.postWithPrefix(`${this.url}/problem_get`, (response) => {
                    edx.HtmlUtils.setHtml(this.el, edx.HtmlUtils.HTML(response.html));
                    JavascriptLoader.executeModuleScripts(this.el, () => {
                        this.setupInputTypes();
                        this.bind();
                        this.queueing();
                        this.forceUpdate(response);
                    });
                });
            }
        };

        /**
         * Initializes JavaScript for custom input types within the problem.
         */
        setupInputTypes = () => {
            this.inputtypeDisplays = {};
            this.$('.capa_inputtype').each((index, inputtype) => {
                const classes = $(inputtype).attr('class').split(' ');
                const id = $(inputtype).attr('id');
                for (const cls of classes) {
                    const setupMethod = this.inputtypeSetupMethods[cls];
                    if (setupMethod) {
                        this.inputtypeDisplays[id] = setupMethod(inputtype);
                    }
                }
            });
        };

        /**
         * Executes a pre-submission validation callback if specified by a 'data-waitfor' attribute on an input.
         * @param {function} callback - The submission function to call if validation passes.
         * @returns {boolean} - True if a waitfor callback was triggered.
         */
        submit_save_waitfor = (callback) => {
            let waitforTriggered = false;
            for (const inp of this.inputs.get()) {
                if ($(inp).is('input[waitfor]')) {
                    try {
                        $(inp).data('waitfor')(() => {
                            this.refreshAnswers();
                            callback();
                        });
                    } catch (e) {
                        if (e.name === 'Waitfor Exception') {
                            alert(e.message); // eslint-disable-line no-alert
                        } else {
                            alert(gettext('Could not grade your answer. The submission was aborted.')); // eslint-disable-line no-alert
                        }
                        throw e;
                    }
                    waitforTriggered = true;
                }
            }
            return waitforTriggered;
        };

        /**
         * Scrolls the page to the top of the problem.
         */
        scroll_to_problem_meta = () => {
            const questionTitle = this.$('.problem-header');
            if (questionTitle.length > 0) {
                $('html, body').animate({ scrollTop: questionTitle.offset().top }, 500);
                questionTitle.focus();
            }
        };

        /**
         * Sets focus on a notification area of a specific type.
         * @param {string} type - The type of notification (e.g., 'submit', 'save').
         */
        focus_on_notification = (type) => {
            const notification = this.$(`.notification-${type}`);
            if (notification.length > 0) {
                notification.focus();
            }
        };

        focus_on_submit_notification = () => this.focus_on_notification('submit');
        focus_on_save_notification = () => this.focus_on_notification('save');
        focus_on_hint_notification = (hintIndex) => {
            this.$(`.notification-hint .notification-message > ol > li.hint-index-${hintIndex}`).focus();
        };

        /**
         * Handles problem submission, including file uploads via FormData.
         */
        submit_fd = () => {
            // Fallback to simpler submit if no file inputs are present.
            if (this.el.find('input:file').length === 0) {
                this.submit();
                return;
            }

            this.enableSubmitButton(false);

            if (!window.FormData) {
                alert(gettext('Submission aborted! Sorry, your browser does not support file uploads. If you can, please use Chrome or Safari which have been verified to support file uploads.'));
                this.enableSubmitButton(true);
                return;
            }

            const timeoutId = this.enableSubmitButtonAfterTimeout();
            const fd = new FormData();
            const errors = [];
            const maxFileSize = 4 * 1000 * 1000; // 4MB

            let fileTooLarge = false;
            let fileNotSelected = false;
            let requiredFilesNotSubmitted = false;
            let unallowedFileSubmitted = false;

            this.inputs.each((index, element) => {
                if (element.type === 'file') {
                    const requiredFiles = $(element).data('required_files');
                    const allowedFiles = $(element).data('allowed_files');

                    if (element.files.length === 0) {
                        fileNotSelected = true;
                        fd.append(element.id, '');
                    }

                    for (const file of element.files) {
                        if (allowedFiles.length !== 0 && !allowedFiles.includes(file.name)) {
                            unallowedFileSubmitted = true;
                            errors.push(edx.StringUtils.interpolate(
                                gettext('You submitted {filename}; only {allowedFiles} are allowed.'),
                                { filename: file.name, allowedFiles: allowedFiles }
                            ));
                        }
                        const requiredIndex = requiredFiles.indexOf(file.name);
                        if (requiredIndex >= 0) {
                            requiredFiles.splice(requiredIndex, 1);
                        }
                        if (file.size > maxFileSize) {
                            fileTooLarge = true;
                            const maxSize = maxFileSize / (1000 * 1000);
                            errors.push(edx.StringUtils.interpolate(
                                gettext('Your file {filename} is too large (max size: {maxSize}MB).'),
                                { filename: file.name, maxSize: maxSize }
                            ));
                        }
                        fd.append(element.id, file);
                    }
                    if (requiredFiles.length !== 0) {
                        requiredFilesNotSubmitted = true;
                        errors.push(edx.StringUtils.interpolate(
                            gettext('You did not submit the required files: {requiredFiles}.'),
                            { requiredFiles: requiredFiles }
                        ));
                    }
                } else {
                    fd.append(element.id, element.value);
                }
            });

            if (fileNotSelected) {
                errors.push(gettext('You did not select any files to submit.'));
            }

            if (errors.length > 0) {
                let errorHtml = edx.HtmlUtils.HTML('<ul>');
                errors.forEach(error => {
                    errorHtml = edx.HtmlUtils.joinHtml(errorHtml, edx.HtmlUtils.interpolateHtml(edx.HtmlUtils.HTML('<li>{error}</li>'), { error }));
                });
                errorHtml = edx.HtmlUtils.joinHtml(errorHtml, edx.HtmlUtils.HTML('</ul>'));
                this.gentle_alert(errorHtml.toString());
            }

            const abortSubmission = fileTooLarge || fileNotSelected || unallowedFileSubmitted || requiredFilesNotSubmitted;
            if (abortSubmission) {
                window.clearTimeout(timeoutId);
                this.enableSubmitButton(true);
            } else {
                const settings = {
                    type: 'POST',
                    data: fd,
                    processData: false,
                    contentType: false,
                    complete: this.enableSubmitButtonAfterResponse,
                    success: (response) => {
                        if (['submitted', 'incorrect', 'correct'].includes(response.success)) {
                            this.render(response.contents);
                            this.updateProgress(response);
                        } else {
                            this.gentle_alert(response.success);
                        }
                        Logger.log('problem_graded', [this.answers, response.contents], this.id);
                    },
                    error: (response) => {
                        this.gentle_alert(response.responseJSON.success);
                    },
                };
                $.ajaxWithPrefix(`${this.url}/problem_check`, settings);
            }
        };

        /**
         * Main submission handler.
         */
        submit = () => {
            if (!this.submit_save_waitfor(this.submit_internal)) {
                this.disableAllButtonsWhileRunning(this.submit_internal, true);
            }
        };

        /**
         * Internal logic for submitting answers via AJAX.
         * @returns {jqXHR} - The jQuery AJAX request object.
         */
        submit_internal = () => {
            Logger.log('problem_check', this.answers);
            return $.postWithPrefix(`${this.url}/problem_check`, this.answers, (response) => {
                if (['submitted', 'incorrect', 'correct'].includes(response.success)) {
                    window.SR.readTexts(this.get_sr_status(response.contents));
                    this.el.trigger('contentChanged', [this.id, response.contents, response]);
                    this.render(response.contents, this.focus_on_submit_notification);
                    this.updateProgress(response);

                    if (response.entrance_exam_passed) {
                        window.parent.postMessage({ type: 'entranceExam.passed' }, '*');
                    }
                } else {
                    this.saveNotification.hide();
                    this.gentle_alert(response.success);
                }
                Logger.log('problem_graded', [this.answers, response.contents], this.id);
            });
        };

        /**
         * Gathers status text for screen readers from the response HTML.
         * @param {string} contents - The HTML string of the response.
         * @returns {string[]} - An array of status messages for the screen reader.
         */
        get_sr_status = (contents) => {
            const statusElements = $(contents).find('.status');
            const labeledStatus = [];

            for (const element of statusElements.get()) {
                const parentSection = $(element).closest('.wrapper-problem-response');
                let addedStatus = false;
                if (parentSection.length) {
                    const ariaLabel = parentSection.attr('aria-label');
                    if (ariaLabel) {
                        const template = gettext('{label}: {status}');
                        labeledStatus.push(
                            edx.StringUtils.interpolate(template, { label: ariaLabel, status: $(element).text() })
                        );
                        addedStatus = true;
                    }
                }
                if (!addedStatus) {
                    labeledStatus.push($(element).text());
                }
            }
            return labeledStatus;
        };

        /**
         * Resets the problem to its initial state.
         */
        reset = () => {
            this.disableAllButtonsWhileRunning(this.reset_internal, false);
        };

        /**
         * Internal logic for resetting the problem via AJAX.
         * @returns {jqXHR} - The jQuery AJAX request object.
         */
        reset_internal = () => {
            Logger.log('problem_reset', this.answers);
            return $.postWithPrefix(`${this.url}/problem_reset`, { id: this.id }, (response) => {
                if (response.success) {
                    this.el.trigger('contentChanged', [this.id, response.html, response]);
                    this.render(response.html, this.scroll_to_problem_meta);
                    this.updateProgress(response);
                    window.SR.readText(gettext('This problem has been reset.'));
                } else {
                    this.gentle_alert(response.msg);
                }
            });
        };

        /**
         * Requests and displays the correct answer(s) for the problem.
         * @returns {jqXHR} - The jQuery AJAX request object.
         */
        show = () => {
            Logger.log('problem_show', { problem: this.id });
            return $.postWithPrefix(`${this.url}/problem_show`, (response) => {
                const { answers } = response;
                $.each(answers, (key, value) => {
                    if (!Array.isArray(value)) {
                        const safeKey = key.replace(/[:.]/g, '\\$&');
                        const answerEl = this.$(`#answer_${safeKey}, #solution_${safeKey}`);
                        edx.HtmlUtils.setHtml(answerEl, edx.HtmlUtils.HTML(value));
                        Collapsible.setCollapsibles(answerEl);
                    }
                });

                this.$('.capa_inputtype').each((index, inputtype) => {
                    const classes = $(inputtype).attr('class').split(' ');
                    for (const cls of classes) {
                        const display = this.inputtypeDisplays[$(inputtype).attr('id')];
                        const showMethod = this.inputtypeShowAnswerMethods[cls];
                        showMethod?.(inputtype, display, answers, response.correct_status_html);
                    }
                });

                if (window.MathJax) {
                    this.$('.problem > div').each((index, element) => {
                        MathJax.Hub.Queue(['Typeset', MathJax.Hub, element]);
                    });
                }
                this.$('.show').attr('disabled', 'disabled');
                this.updateProgress(response);
                this.clear_all_notifications();
                this.showAnswerNotification.show();
                this.focus_on_notification('show-answer');
            });
        };

        /**
         * Hides all notification messages.
         */
        clear_all_notifications = () => {
            this.submitNotification.remove();
            this.gentleAlertNotification.hide();
            this.saveNotification.hide();
            this.showAnswerNotification.hide();
        };

        /**
         * Displays a non-modal alert message to the user.
         * @param {string} msg - The HTML message to display.
         */
        gentle_alert = (msg) => {
            edx.HtmlUtils.setHtml(
                this.$('.notification-gentle-alert .notification-message'),
                edx.HtmlUtils.HTML(msg)
            );
            this.clear_all_notifications();
            this.gentleAlertNotification.show();
            this.gentleAlertNotification.focus();
        };

        /**
         * Saves the user's current answers without grading.
         */
        save = () => {
            if (!this.submit_save_waitfor(this.save_internal)) {
                this.disableAllButtonsWhileRunning(this.save_internal, false);
            }
        };

        /**
         * Internal logic for saving answers via AJAX.
         * @returns {jqXHR} - The jQuery AJAX request object.
         */
        save_internal = () => {
            Logger.log('problem_save', this.answers);
            return $.postWithPrefix(`${this.url}/problem_save`, this.answers, (response) => {
                if (response.success) {
                    this.el.trigger('contentChanged', [this.id, response.html, response]);
                    edx.HtmlUtils.setHtml(
                        this.$('.notification-save .notification-message'),
                        edx.HtmlUtils.HTML(response.msg)
                    );
                    this.clear_all_notifications();
                    this.$('.wrapper-problem-response .message').hide();
                    this.saveNotification.show();
                    this.focus_on_save_notification();
                } else {
                    this.gentle_alert(response.msg);
                }
            });
        };

        /**
         * Refreshes the MathJax preview for a math input field.
         * @param {Event} event - The event that triggered the refresh.
         * @param {HTMLElement} [element] - The target input element.
         */
        refreshMath = (event, element) => {
            const targetElement = element || event.target;
            const elid = targetElement.id.replace(/^input_/, '');
            const target = `display_${elid}`;
            const preprocessorTag = `inputtype_${elid}`;
            const mathjaxPreprocessor = this.inputtypeDisplays[preprocessorTag];

            if (window.MathJax && MathJax.Hub.getAllJax(target)[0]) {
                const jax = MathJax.Hub.getAllJax(target)[0];
                let eqn = $(targetElement).val();
                if (mathjaxPreprocessor) {
                    eqn = mathjaxPreprocessor(eqn);
                }
                MathJax.Hub.Queue(['Text', jax, eqn], [this.updateMathML, jax, targetElement]);
            }
        };

        /**
         * Updates the hidden MathML input field after a MathJax render.
         * @param {object} jax - The MathJax object.
         * @param {HTMLElement} element - The original input element.
         */
        updateMathML = (jax, element) => {
            try {
                $(`#${element.id}_dynamath`).val(jax.root.toMathML(''));
            } catch (exception) {
                if (!exception.restart) {
                    throw exception;
                }
                if (window.MathJax) {
                    MathJax.Callback.After([this.refreshMath, jax], exception.restart);
                }
            }
        };

        /**
         * Serializes the current state of all inputs into the `this.answers` property.
         */
        refreshAnswers = () => {
            this.$('input.schematic').each((index, element) => {
                element.schematic.update_value();
            });
            this.$('.CodeMirror').each((index, element) => {
                element.CodeMirror?.save();
            });
            this.answers = this.inputs.serialize();
        };

        /**
         * Enables or disables the submit button based on whether any inputs have been answered.
         * @param {boolean} [bind=false] - If true, attach event handlers to inputs.
         */
        submitAnswersAndSubmitButton = (bind = false) => {
            let answered = true;
            let atLeastOneTextInputFound = false;
            let oneTextInputFilled = false;

            this.$('input:text').each((i, textField) => {
                if ($(textField).is(':visible')) {
                    atLeastOneTextInputFound = true;
                    if ($(textField).val() !== '') {
                        oneTextInputFilled = true;
                    }
                    if (bind) {
                        $(textField).on('input', () => {
                            this.saveNotification.hide();
                            this.showAnswerNotification.hide();
                            this.submitAnswersAndSubmitButton();
                        });
                    }
                }
            });

            if (atLeastOneTextInputFound && !oneTextInputFilled) {
                answered = false;
            }

            this.$('.choicegroup').each((i, choicegroupBlock) => {
                if (!$(choicegroupBlock).find('input[type=checkbox]:checked, input[type=radio]:checked').length) {
                    answered = false;
                }
                if (bind) {
                    $(choicegroupBlock).find('input[type=checkbox], input[type=radio]').on('click', () => {
                        this.saveNotification.hide();
                        this.$('.show').removeAttr('disabled');
                        this.showAnswerNotification.hide();
                        this.submitAnswersAndSubmitButton();
                    });
                }
            });

            this.$('select').each((i, selectField) => {
                if ($(selectField).find('option:selected').text().trim() === 'Select an option') {
                    answered = false;
                }
                if (bind) {
                    $(selectField).on('change', () => {
                        this.saveNotification.hide();
                        this.showAnswerNotification.hide();
                        this.submitAnswersAndSubmitButton();
                    });
                }
            });

            this.enableSubmitButton(answered, answered);
        };

        /**
         * Attaches event handlers to inputs to reset their correctness status on interaction.
         */
        bindResetCorrectness = () => {
            const $inputtypes = this.el.find('.capa_inputtype, .inputtype');
            $inputtypes.each((index, inputtype) => {
                const classes = $(inputtype).attr('class').split(' ');
                for (const cls of classes) {
                    this.bindResetCorrectnessByInputtype[cls]?.(inputtype);
                }
            });
        };

        /**
         * A map of methods to reset the correctness state for different input types.
         */
        bindResetCorrectnessByInputtype = {
            formulaequationinput: (element) => {
                $(element).find('input').on('input', function () {
                    const $p = $(element).find('span.status');
                    $p.removeClass('correct incorrect submitted');
                    $p.parent().removeAttr('class').addClass('unsubmitted');
                });
            },
            choicegroup: (element) => {
                const $element = $(element);
                const id = ($element.attr('id').match(/^inputtype_(.*)$/))[1];
                $element.find('input').on('change', () => {
                    const $status = $(`#status_${id}`);
                    if ($status.length) {
                        $status.removeAttr('class').addClass('status unanswered');
                    }
                    $element.find('label span.status.correct').remove();
                    $element.find('label').removeAttr('class');
                });
            },
            'option-input': (element) => {
                const $select = $(element).find('select');
                const id = ($select.attr('id').match(/^input_(.*)$/))[1];
                $select.on('change', () => {
                    $(`#status_${id}`)
                        .removeAttr('class')
                        .addClass('unanswered')
                        .find('.sr')
                        .text(gettext('unsubmitted'));
                });
            },
            textline: (element) => {
                $(element).find('input').on('input', function () {
                    const $p = $(element).find('span.status');
                    $p.removeClass('correct incorrect submitted');
                    $p.parent().removeClass('correct incorrect').addClass('unsubmitted');
                });
            },
        };

        /**
         * A map of methods to set up different input types.
         */
        inputtypeSetupMethods = {
            'text-input-dynamath': (element) => {
                const data = $(element).find('.text-input-dynamath_data');
                const preprocessorClassName = data.data('preprocessor');
                const PreprocessorClass = window[preprocessorClassName];
                if (PreprocessorClass) {
                    const preprocessor = new PreprocessorClass();
                    return preprocessor.fn;
                }
                return false;
            },
            cminput: (container) => {
                const element = $(container).find('textarea');
                const tabsize = element.data('tabsize');
                const mode = element.data('mode');
                const linenumbers = element.data('linenums');
                const spaces = ' '.repeat(parseInt(tabsize, 10));

                const codeMirrorEditor = CodeMirror.fromTextArea(element[0], {
                    lineNumbers: linenumbers,
                    indentUnit: tabsize,
                    tabSize: tabsize,
                    mode: mode,
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

                const id = element.attr('id').replace(/^input_/, '');
                const codeMirrorTextArea = codeMirrorEditor.getInputField();
                codeMirrorTextArea.setAttribute('id', `cm-textarea-${id}`);
                codeMirrorTextArea.setAttribute('aria-describedby', `cm-editor-exit-message-${id} status_${id}`);
                return codeMirrorEditor;
            },
        };

        /**
         * A map of methods to display the correct answer for different input types.
         */
        inputtypeShowAnswerMethods = {
            choicegroup: (element, display, answers, correctStatusHtml) => {
                const $element = $(element);
                let inputId = $element.attr('id').replace(/inputtype_/, '');
                inputId = inputId.replace(':', '\\:');
                const safeId = inputId.replace(/\./g, '\\.');
                const answer = answers[inputId];

                for (const choice of answer) {
                    const $inputLabel = $element.find(`#input_${safeId}_${choice} + label`);
                    const $inputStatus = $element.find(`#status_${safeId}`);
                    if ($inputStatus.hasClass('unanswered')) {
                        edx.HtmlUtils.append($inputLabel, edx.HtmlUtils.HTML(correctStatusHtml));
                        $inputLabel.addClass('choicegroup_correct');
                    } else if (!$inputLabel.hasClass('choicegroup_correct')) {
                        edx.HtmlUtils.append($inputLabel, edx.HtmlUtils.HTML(correctStatusHtml));
                        $inputLabel.removeClass('choicegroup_incorrect').addClass('choicegroup_correct');
                    }
                }
            },
            choicetextgroup: (element, display, answers) => {
                const $element = $(element);
                const inputId = $element.attr('id').replace(/inputtype_/, '');
                const answer = answers[inputId];
                for (const choice of answer) {
                    $element.find(`section#forinput${choice}`).addClass('choicetextgroup_show_correct');
                }
            },
            imageinput: (element, display, answers) => {
                // Defines drawing functions for different shape types.
                const types = {
                    rectangle: (ctx, coords) => {
                        const reg = /^\(([0-9]+),([0-9]+)\)-\(([0-9]+),([0-9]+)\)$/;
                        const rects = coords.replace(/\s*/g, '').split(/;/);

                        rects.forEach(rect => {
                            const points = reg.exec(rect);
                            if (points) {
                                // points[1]=x1, points[2]=y1, points[3]=x2, points[4]=y2
                                const width = Math.abs(points[3] - points[1]);
                                const height = Math.abs(points[4] - points[2]);
                                ctx.rect(points[1], points[2], width, height);
                            }
                        });
                        ctx.stroke();
                        ctx.fill();
                    },
                    regions: (ctx, coords) => {
                        const parseCoords = (coordinates) => {
                            let parsed = JSON.parse(coordinates);
                            // Standardize single-region arrays into the multi-region format for consistent processing.
                            // It checks if the structure is [[x,y], [x,y]] instead of [[[x,y]], [[x,y]]].
                            if (typeof parsed[0]?.[0]?.[0] === 'undefined') {
                                parsed = [parsed];
                            }
                            return parsed;
                        };

                        const regions = parseCoords(coords);
                        regions.forEach(region => {
                            ctx.beginPath();
                            region.forEach((point, idx) => {
                                if (idx === 0) {
                                    ctx.moveTo(point[0], point[1]);
                                } else {
                                    ctx.lineTo(point[0], point[1]);
                                }
                            });
                            ctx.closePath();
                            ctx.stroke();
                            ctx.fill();
                        });
                    },
                };

                const $element = $(element);
                const id = $element.attr('id').replace(/inputtype_/, '');
                const container = $element.find(`#answer_${id}`);
                const canvas = document.createElement('canvas');
                canvas.width = container.data('width');
                canvas.height = container.data('height');

                let context;
                if (canvas.getContext) {
                    context = canvas.getContext('2d');
                } else {
                    console.log('Canvas is not supported.');
                    return; // Exit if the browser doesn't support canvas
                }

                context.fillStyle = 'rgba(255, 255, 255, 0.3)';
                context.strokeStyle = '#FF0000';
                context.lineWidth = 2;

                const answerData = answers[id];
                if (answerData) {
                    // Iterate over the answer parts (e.g., 'rectangle', 'regions')
                    for (const [key, value] of Object.entries(answerData)) {
                        // Check if a drawing function exists for this key and if there's a value.
                        if (types[key] && value) {
                            types[key](context, value);
                        }
                    }
                    edx.HtmlUtils.setHtml(container, edx.HtmlUtils.HTML(canvas));
                } else {
                    console.log(`Answer is absent for image input with id=${id}`);
                }
            }
        };

        /**
         * Disables all action buttons, runs an operation, then re-enables them.
         * @param {function} operationCallback - The function to run (should return a promise/jqXHR).
         * @param {boolean} isFromCheckOperation - True if the operation is a submission check.
         */
        disableAllButtonsWhileRunning = (operationCallback, isFromCheckOperation) => {
            const allButtons = [this.resetButton, this.saveButton, this.showButton, this.hintButton, this.submitButton];
            const initiallyEnabledButtons = allButtons.filter(button => button && !button.attr('disabled'));
            this.enableButtons(initiallyEnabledButtons, false, isFromCheckOperation);
            operationCallback().always(() => {
                this.enableButtons(initiallyEnabledButtons, true, isFromCheckOperation);
            });
        };

        /**
         * Utility to enable or disable a list of buttons.
         * @param {jQuery[]} buttons - An array of jQuery button objects.
         * @param {boolean} enable - True to enable, false to disable.
         * @param {boolean} changeSubmitButtonText - True to change the submit button's text.
         */
        enableButtons = (buttons, enable, changeSubmitButtonText) => {
            buttons.forEach(button => {
                if (button.hasClass('submit')) {
                    this.enableSubmitButton(enable, changeSubmitButtonText);
                } else if (enable) {
                    button.removeAttr('disabled');
                } else {
                    button.attr('disabled', 'disabled');
                }
            });
        };

        /**
         * Enables or disables the submit button specifically.
         * @param {boolean} enable - True to enable, false to disable.
         * @param {boolean} [changeText=true] - True to update the button's text.
         */
        enableSubmitButton = (enable, changeText = true) => {
            if (enable) {
                const submitCanBeEnabled = this.submitButton.data('should-enable-submit-button') === 'True';
                if (submitCanBeEnabled) {
                    this.submitButton.removeAttr('disabled');
                }
                if (changeText) {
                    this.submitButtonLabel.text(this.submitButtonSubmitText);
                }
            } else {
                this.submitButton.attr('disabled', 'disabled');
                if (changeText) {
                    this.submitButtonLabel.text(this.submitButtonSubmittingText);
                }
            }
        };

        /**
         * Part of a two-step process to re-enable the submit button after a delay.
         */
        enableSubmitButtonAfterResponse = () => {
            this.has_response = true;
            if (this.has_timed_out) {
                this.enableSubmitButton(true);
            } else {
                this.enableSubmitButton(false);
            }
        };

        /**
         * Sets a minimum timeout before the submit button can be re-enabled.
         * @returns {number} - The timeout ID.
         */
        enableSubmitButtonAfterTimeout = () => {
            this.has_timed_out = false;
            this.has_response = false;

            const enable = () => {
                this.has_timed_out = true;
                if (this.has_response) {
                    this.enableSubmitButton(true);
                }
            };
            return window.setTimeout(enable, 750);
        };

        /**
         * Handles the 'Hint' button click, requesting the next available hint.
         * @returns {jqXHR} - The jQuery AJAX request object.
         */
        hint_button = () => {
            const hintContainer = this.$('.problem-hint');
            const hintIndex = hintContainer.attr('hint_index');
            const nextIndex = (hintIndex === undefined) ? 0 : parseInt(hintIndex, 10) + 1;

            return $.postWithPrefix(`${this.url}/hint_button`, { hint_index: nextIndex, input_id: this.id }, (response) => {
                if (response.success) {
                    const hintMsgContainer = this.$('.problem-hint .notification-message');
                    hintContainer.attr('hint_index', response.hint_index);
                    edx.HtmlUtils.setHtml(hintMsgContainer, edx.HtmlUtils.HTML(response.msg));
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, hintContainer[0]]);

                    if (response.should_enable_next_hint) {
                        this.hintButton.removeAttr('disabled');
                    } else {
                        this.hintButton.attr('disabled', 'disabled');
                    }
                    this.$('.notification-hint').show();
                    this.focus_on_hint_notification(nextIndex);
                } else {
                    this.gentle_alert(response.msg);
                }
            });
        };
    } // End of ProblemHandler class

    Problem.inputAjax = ProblemHandler.inputAjax;
    // Instantiate the handler to initialize the problem XBlock.
    new ProblemHandler(runtime, element);
}