/* global MathJax, Collapsible, JavascriptLoader, Logger, CodeMirror, $, edx, ngettext, gettext */

/**
 * A class to manage the client-side interactions of a CAPA problem.
 * This includes handling submissions, hints, resets, and rendering progress.
 */
class Problem {
    /**
     * An object containing methods to reset the correctness status for different input types.
     * These are triggered when a user interacts with an input field after a submission.
     */
    static bindResetCorrectnessByInputtype = {
        formulaequationinput: (element) => {
            $(element).find('input').on('input', () => {
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
                } else {
                    $('<span>', {
                        class: 'status unanswered',
                        style: 'display: inline-block;',
                        id: `status_${id}`,
                    });
                }
                $element.find('label').find('span.status.correct').remove();
                $element.find('label').removeAttr('class');
            });
        },
        'option-input': (element) => {
            const $select = $(element).find('select');
            const id = ($select.attr('id').match(/^input_(.*)$/))[1];
            $select.on('change', () => {
                $(`#status_${id}`).removeAttr('class').addClass('unanswered')
                    .find('.sr')
                    .text(gettext('unsubmitted'));
            });
        },
        textline: (element) => {
            $(element).find('input').on('input', () => {
                const $p = $(element).find('span.status');
                $p.removeClass('correct incorrect submitted');
                $p.parent().removeClass('correct incorrect').addClass('unsubmitted');
            });
        },
    };

    /**
     * An object containing setup methods for various capa input types.
     * These are called once when the problem is first rendered.
     */
    static inputtypeSetupMethods = {
        'text-input-dynamath': (element) => {
            const data = $(element).find('.text-input-dynamath_data');
            const preprocessorClassName = data.data('preprocessor');
            const PreprocessorClass = window[preprocessorClassName];
            if (!PreprocessorClass) {
                return false;
            }
            const preprocessor = new PreprocessorClass();
            return preprocessor.fn;
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

            const id = element.attr('id').replace(/^input_/, '');
            const codeMirrorTextArea = codeMirrorEditor.getInputField();
            codeMirrorTextArea.setAttribute('id', `cm-textarea-${id}`);
            codeMirrorTextArea.setAttribute('aria-describedby', `cm-editor-exit-message-${id} status_${id}`);
            return codeMirrorEditor;
        },
    };

    /**
     * An object containing methods to display the correct answer for different input types.
     */
    static inputtypeShowAnswerMethods = {
        choicegroup: (element, display, answers, correctStatusHtml) => {
            const $element = $(element);
            let inputId = $element.attr('id').replace(/inputtype_/, '');
            inputId = inputId.replace(':', '\\:');
            const safeId = inputId.replace(/\./g, '\\.');
            const answer = answers[inputId];

            if (answer) {
                answer.forEach((choice) => {
                    const $inputLabel = $element.find(`#input_${safeId}_${choice} + label`);
                    const $inputStatus = $element.find(`#status_${safeId}`);
                    if ($inputStatus.hasClass('unanswered')) {
                        edx.HtmlUtils.append($inputLabel, edx.HtmlUtils.HTML(correctStatusHtml));
                        $inputLabel.addClass('choicegroup_correct');
                    } else if (!$inputLabel.hasClass('choicegroup_correct')) {
                        edx.HtmlUtils.append($inputLabel, edx.HtmlUtils.HTML(correctStatusHtml));
                        $inputLabel.removeClass('choicegroup_incorrect').addClass('choicegroup_correct');
                    }
                });
            }
        },
        // ... other show answer methods from original file ...
        // For brevity, the rest of the static methods are omitted,
        // but they should be placed here, in the same fashion.
    };

    /**
     * A static method for making an AJAX call on behalf of an input type.
     */
    static inputAjax(url, inputId, dispatch, data, callback) {
        const payload = { ...data, dispatch, input_id: inputId };
        return $.postWithPrefix(`${url}/input_ajax`, payload, callback);
    }

    constructor(element) {
        this.wrapper = $(element);
        this.el = this.wrapper.find('.problems-wrapper');
        this.id = this.el.data('problem-id');
        this.element_id = this.el.attr('id');
        this.url = this.el.data('url');
        this.content = this.el.data('content');

        this.has_timed_out = false;
        this.has_response = false;

        this.render(this.content);
    }

    /**
     * A jQuery-like selector scoped to the problem element.
     */
    $(selector) {
        return $(selector, this.el);
    }

    /**
     * Sets up event handlers and initializes components within the problem.
     */
    bind() {
        if (window.MathJax) {
            this.el.find('.problem > div').each((index, element) => {
                MathJax.Hub.Queue(['Typeset', MathJax.Hub, element]);
            });
        }
        if (window.update_schematics) {
            window.update_schematics();
        }

        const problemPrefix = this.element_id.replace(/problem_/, '');
        this.inputs = this.$(`[id^="input_${problemPrefix}_"]`);
        this.$('div.action button').on('click', this.refreshAnswers);

        // Bind buttons
        this.submitButton = this.$('.action .submit').on('click', this.submit_fd);
        this.submitButtonLabel = this.$('.action .submit .submit-label');
        this.submitButtonSubmitText = this.submitButtonLabel.text();
        this.submitButtonSubmittingText = this.submitButton.data('submitting');
        this.hintButton = this.$('.action .hint-button').on('click', this.hint_button);
        this.resetButton = this.$('.action .reset').on('click', this.reset);
        this.showButton = this.$('.action .show').on('click', this.show);
        this.saveButton = this.$('.action .save').on('click', this.save);

        // Bind notifications and other elements
        this.saveNotification = this.$('.notification-save');
        this.showAnswerNotification = this.$('.notification-show-answer');
        this.gentleAlertNotification = this.$('.notification-gentle-alert');
        this.submitNotification = this.$('.notification-submit');

        // Bind accessibility helpers and initial state
        this.bindResetCorrectness();
        if (this.submitButton.length) {
            this.submitAnswersAndSubmitButton(true);
        }
        Collapsible.setCollapsibles(this.el);
        this.$('input.math').on('keyup', this.refreshMath);
        if (window.MathJax) {
            this.$('input.math').each((index, element) => {
                MathJax.Hub.Queue([this.refreshMath, null, element]);
            });
        }
    }

    /**
     * Renders the problem content and sets up all necessary components.
     */
    render(content, focusCallback) {
        if (content) {
            edx.HtmlUtils.setHtml(this.el, edx.HtmlUtils.HTML(content));
            JavascriptLoader.executeModuleScripts(this.el, () => {
                this.setupInputTypes();
                this.bind();
                this.queueing(focusCallback);
                this.renderProgressState();
                if (typeof focusCallback === 'function') {
                    focusCallback();
                }
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
    }

    /**
     * Instantiates controllers for each `capa_inputtype` in the problem.
     */
    setupInputTypes() {
        this.inputtypeDisplays = {};
        this.el.find('.capa_inputtype').each((index, inputtype) => {
            const classes = $(inputtype).attr('class').split(' ');
            const id = $(inputtype).attr('id');
            classes.forEach((cls) => {
                const setupMethod = Problem.inputtypeSetupMethods[cls];
                if (setupMethod) {
                    this.inputtypeDisplays[id] = setupMethod(inputtype);
                }
            });
        });
    }

    /**
     * Updates the user's progress display (e.g., "1/2 points").
     */
    updateProgress = (response) => {
        if (response.progress_changed) {
            this.el.data('problem-score', response.current_score);
            this.el.data('problem-total-possible', response.total_possible);
            this.el.data('attempts-used', response.attempts_used);
            this.el.trigger('progressChanged');
        }
        this.renderProgressState();
    };

    /**
     * Submits the problem answers for grading.
     */
    submit = () => {
        this.disableAllButtonsWhileRunning(this.submit_internal, true);
    };

    submit_internal = () => {
        Logger.log('problem_check', this.answers);
        return $.postWithPrefix(`${this.url}/problem_check`, this.answers, (response) => {
            switch (response.success) {
                case 'submitted':
                case 'incorrect':
                case 'correct':
                    window.SR.readTexts(this.get_sr_status(response.contents));
                    this.el.trigger('contentChanged', [this.id, response.contents, response]);
                    this.render(response.contents, this.focus_on_submit_notification);
                    this.updateProgress(response);
                    if (response.entrance_exam_passed) {
                        window.parent.postMessage({ type: 'entranceExam.passed' }, '*');
                    }
                    break;
                default:
                    this.saveNotification.hide();
                    this.gentle_alert(response.success);
            }
            Logger.log('problem_graded', [this.answers, response.contents], this.id);
        });
    };

    /**
     * Handles file uploads via FormData before submitting.
     */
    submit_fd = () => {
        // Fallback for problems without file inputs.
        if (this.el.find('input:file').length === 0) {
            this.submit();
            return;
        }
        // ... The rest of the submit_fd logic from the original file should go here.
        // It's a large function, so it's omitted for brevity.
    };

    /**
     * Resets the problem to its initial state.
     */
    reset = () => {
        this.disableAllButtonsWhileRunning(this.reset_internal, false);
    };

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
     * Shows the correct answer(s) for the problem.
     */
    show = () => {
        Logger.log('problem_show', { problem: this.id });
        // ... The logic for the `show` method from the original file goes here.
    };

    /**
     * Saves the current state of the problem without grading.
     */
    save = () => {
        this.disableAllButtonsWhileRunning(this.save_internal, false);
    };

    save_internal = () => {
        Logger.log('problem_save', this.answers);
        // ... The logic for the `save_internal` method goes here.
    };
    
    /**
     * Requests a hint from the server.
     */
    hint_button = () => {
        const hintContainer = this.$('.problem-hint');
        const hintIndex = hintContainer.attr('hint_index');
        const nextIndex = (hintIndex === undefined) ? 0 : parseInt(hintIndex, 10) + 1;

        $.postWithPrefix(`${this.url}/hint_button`, { hint_index: nextIndex, input_id: this.id }, (response) => {
            if (response.success) {
                const hintMsgContainer = this.$('.problem-hint .notification-message');
                hintContainer.attr('hint_index', response.hint_index);
                edx.HtmlUtils.setHtml(hintMsgContainer, edx.HtmlUtils.HTML(response.msg));
                if (window.MathJax) {
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, hintContainer[0]]);
                }
                this.hintButton.prop('disabled', !response.should_enable_next_hint);
                this.el.find('.notification-hint').show();
                this.focus_on_hint_notification(nextIndex);
            } else {
                this.gentle_alert(response.msg);
            }
        });
    };

    // ... Other methods like `refreshAnswers`, `enableSubmitButton`, `gentle_alert`, etc.
    // should be included here, converted to class methods. Many can be arrow functions
    // if they are used as event handlers. For brevity, they are omitted from this example.
}
/**
 * This is the factory function that will be called by the XBlock runtime.
 * It acts as a bridge between the old function-call style and the new ES6 class.
 *
 * @param {HTMLElement} element - The DOM element for this problem instance.
 * @returns {Problem} A new instance of the Problem class.
 */
window.Problem = function(element) {
    // The runtime calls this function without 'new', and we correctly
    // instantiate and return the class instance here.
    return new Problem(element);
};