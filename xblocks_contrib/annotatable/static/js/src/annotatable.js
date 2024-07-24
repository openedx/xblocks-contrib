function AnnotatableXBlock(runtime, element, data) {
    class Annotatable {
        constructor(el) {
            this.onMoveTip = this.onMoveTip.bind(this);
            this.onShowTip = this.onShowTip.bind(this);
            this.onClickReturn = this.onClickReturn.bind(this);
            this.onClickReply = this.onClickReply.bind(this);
            this.onClickToggleInstructions = this.onClickToggleInstructions.bind(this);
            this.onClickToggleAnnotations = this.onClickToggleAnnotations.bind(this);

            if (this._debug) {
                console.log('loaded Annotatable');
            }

            this.el = el;
            this.$el = $(el);
            this.init();
        }

        _debug = false;
        wrapperSelector = '.annotatable-wrapper';
        toggleAnnotationsSelector = '.annotatable-toggle-annotations';
        toggleInstructionsSelector = '.annotatable-toggle-instructions';
        instructionsSelector = '.annotatable-instructions';
        sectionSelector = '.annotatable-section';
        spanSelector = '.annotatable-span';
        replySelector = '.annotatable-reply';
        problemSelector = 'div.problem';
        problemInputSelector = 'div.problem .annotation-input';
        problemReturnSelector = 'div.problem .annotation-return';

        $(selector) {
            return $(selector, this.el);
        }

        init() {
            this.initEvents();
            this.initTips();
        }

        initEvents() {
            const ref = [false, false];
            [this.annotationsHidden, this.instructionsHidden] = ref;
            this.$(this.toggleAnnotationsSelector).on('click', this.onClickToggleAnnotations);
            this.$(this.toggleInstructionsSelector).on('click', this.onClickToggleInstructions);
            this.$el.on('click', this.replySelector, this.onClickReply);
            $(document).on('click', this.problemReturnSelector, this.onClickReturn);
        }

        initTips() {
            this.$(this.spanSelector).each((index, el) => {
                $(el).qtip(this.getSpanTipOptions(el));
            });
        }

        getSpanTipOptions(el) {
            return {
                content: {
                    title: {
                        text: this.makeTipTitle(el),
                    },
                    text: this.makeTipContent(el),
                },
                position: {
                    my: 'bottom center',
                    at: 'top center',
                    target: $(el),
                    container: this.$(this.wrapperSelector),
                    adjust: {
                        y: -5,
                    },
                },
                show: {
                    event: 'click mouseenter',
                    solo: true,
                },
                hide: {
                    event: 'click mouseleave',
                    delay: 500,
                    fixed: true,
                },
                style: {
                    classes: 'ui-tooltip-annotatable',
                },
                events: {
                    show: this.onShowTip,
                    move: this.onMoveTip,
                },
            };
        }

        onClickToggleAnnotations() {
            this.toggleAnnotations();
        }

        onClickToggleInstructions() {
            this.toggleInstructions();
        }

        onClickReply(e) {
            this.replyTo(e.currentTarget);
        }

        onClickReturn(e) {
            this.returnFrom(e.currentTarget);
        }

        onShowTip(event) {
            if (this.annotationsHidden) {
                event.preventDefault();
            }
        }

        onMoveTip(event, api, position) {
            const tip = api.elements.tooltip;
            const adjustY = api.options.position?.adjust?.y || 0;
            const container = api.options.position?.container || $('body');
            const target = api.elements.target;
            const rects = $(target).get(0).getClientRects();
            const isNonOverlapping = rects?.length === 2 && rects[0].left > rects[1].right;
            const focusRect = isNonOverlapping ? (rects[0].width > rects[1].width ? rects[0] : rects[1]) : rects[0];
            const rectCenter = focusRect.left + focusRect.width / 2;
            const rectTop = focusRect.top;
            const tipWidth = $(tip).width();
            const tipHeight = $(tip).height();
            const containerOffset = $(container).offset();
            const offsetLeft = -containerOffset.left;
            const offsetTop = $(document).scrollTop() - containerOffset.top;
            let tipLeft = offsetLeft + rectCenter - tipWidth / 2;
            let tipTop = offsetTop + rectTop - tipHeight + adjustY;
            const winWidth = $(window).width();

            if (tipLeft < offsetLeft) {
                tipLeft = offsetLeft;
            } else if (tipLeft + tipWidth > winWidth + offsetLeft) {
                tipLeft = winWidth + offsetLeft - tipWidth;
            }

            $.extend(position, {
                left: tipLeft,
                top: tipTop,
            });
        }

        getSpanForProblemReturn(el) {
            const problemId = $(this.problemReturnSelector).index(el);
            return this.$(this.spanSelector).filter(`[data-problem-id='${problemId}']`);
        }

        getProblem(el) {
            const problemId = this.getProblemId(el);
            return $(this.problemInputSelector).eq(problemId);
        }

        getProblemId(el) {
            return $(el).data('problem-id');
        }

        toggleAnnotations() {
            const hide = (this.annotationsHidden = !this.annotationsHidden);
            this.toggleAnnotationButtonText(hide);
            this.toggleSpans(hide);
            this.toggleTips(hide);
        }

        toggleTips(hide) {
            const visible = this.findVisibleTips();
            this.hideTips(visible);
        }

        toggleAnnotationButtonText(hide) {
            const buttonText = hide ? gettext('Show Annotations') : gettext('Hide Annotations');
            this.$(this.toggleAnnotationsSelector).text(buttonText);
        }

        toggleInstructions() {
            const hide = (this.instructionsHidden = !this.instructionsHidden);
            this.toggleInstructionsButton(hide);
            this.toggleInstructionsText(hide);
        }

        toggleInstructionsButton(hide) {
            const txt = hide ? gettext('Expand Instructions') : gettext('Collapse Instructions');
            const cls = hide ? ['expanded', 'collapsed'] : ['collapsed', 'expanded'];
            this.$(this.toggleInstructionsSelector).text(txt).removeClass(cls[0]).addClass(cls[1]);
        }

        toggleInstructionsText(hide) {
            const slideMethod = hide ? 'slideUp' : 'slideDown';
            this.$(this.instructionsSelector)[slideMethod]();
        }

        toggleSpans(hide) {
            this.$(this.spanSelector).toggleClass('hide', hide, 250);
        }

        replyTo(buttonEl) {
            const offset = -20;
            const el = this.getProblem(buttonEl);

            if (el.length > 0) {
                this.scrollTo(el, this.afterScrollToProblem, offset);
            } else if (this._debug) {
                console.log('problem not found. event: ', e);
            }
        }

        returnFrom(buttonEl) {
            const offset = -200;
            const el = this.getSpanForProblemReturn(buttonEl);

            if (el.length > 0) {
                this.scrollTo(el, this.afterScrollToSpan, offset);
            } else if (this._debug) {
                console.log('span not found. event:', e);
            }
        }

        scrollTo(el, after, offset = -20) {
            if ($(el).length > 0) {
                $('html, body').scrollTo(el, {
                    duration: 500,
                    onAfter: () => {
                        if (after) {
                            after.call(this, el);
                        }
                    },
                    offset,
                });
            }
        }

        afterScrollToProblem(problemEl) {
            problemEl.effect('highlight', {}, 500);
        }

        afterScrollToSpan(spanEl) {
            spanEl.addClass('selected', 400, 'swing', () => {
                spanEl.removeClass('selected', 400, 'swing');
            });
        }

        makeTipContent(el) {
            return () => {
                const text = $(el).data('comment-body');
                const comment = this.createComment(text);
                const problemId = this.getProblemId(el);
                const reply = this.createReplyLink(problemId);
                return $(comment).add(reply);
            };
        }

        makeTipTitle(el) {
            return () => {
                const title = $(el).data('comment-title');
                return title || gettext('Commentary');
            };
        }

        createComment(text) {
            return $('<div class="annotatable-comment">' + text + '</div>'); // xss-lint: disable=javascript-concat-html
        }

        createReplyLink(problemId) {
            const linkTxt = gettext('Reply to Annotation');
            return $(
                '<a class="annotatable-reply" href="javascript:void(0);" data-problem-id="' +
                problemId +
                '">' +
                linkTxt +
                "</a>"
            ); // xss-lint: disable=javascript-concat-html
        }

        findVisibleTips() {
            const visible = [];
            this.$(this.spanSelector).each((index, el) => {
                const api = $(el).qtip('api');
                const tip = $(api?.elements.tooltip);

                if (tip.is(':visible')) {
                    visible.push(el);
                }
            });
            return visible;
        }

        hideTips(elements) {
            $(elements).qtip('hide');
        }

        _once(fn) {
            let done = false;
            return () => {
                if (!done) {
                    fn.call(this);
                    done = true;
                }
            };
        }
    }

    new Annotatable(element);
}