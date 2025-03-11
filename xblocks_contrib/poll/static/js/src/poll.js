
/* JavaScript for PollBlock. */
var _this
const blockIdentifier = '._poll_question_extracted'


function PollBlock(runtime, element) {

    const questionEl = $(element).find(blockIdentifier);
    
    if (questionEl.length !== 1) {
        // We require one question DOM element.
        console.log('ERROR: PollMain constructor requires one question DOM element.');

        return;
    }

    // Just a safety precussion. If we run this code more than once, multiple 'click' callback handlers will be
    // attached to the same DOM elements. We don't want this to happen.
    if (questionEl.attr('poll_main_processed') === 'true') {
        console.log(
            'ERROR: PolMain JS constructor was called on a DOM element that has already been processed once.'
        );

        return;
    }

    // This element was not processed earlier.
    // Make sure that next time we will not process this element a second time.
    questionEl.attr('poll_main_processed', 'true');

    // Access this object inside inner functions.
    _this = this;
    
    // DOM element which contains the current poll along with any conditionals. By default we assume that such
    // element is not present. We will try to find it.
    this.wrapperSectionEl = null;

    (function(tempEl, c1) {
        while (tempEl.tagName.toLowerCase() !== 'body') {
            tempEl = $(tempEl).parent()[0];
            c1 += 1;

            if (
                (tempEl.tagName.toLowerCase() === 'div')
        && ($(tempEl).data('block-type') === 'wrapper')
            ) {
                _this.wrapperSectionEl = tempEl;

                break;
            } else if (c1 > 50) {
                // In case something breaks, and we enter an endless loop, a sane
                // limit for loop iterations.

                break;
            }
        }
    }($(element)[0], 0));

    try {
        this.jsonConfig = JSON.parse(questionEl.children('._poll_question_extracted_div').html());
        $.ajax({
            type: 'POST',
            url: runtime.handlerUrl(element, 'handle_get_state'),
            data: JSON.stringify(null),
            success: function(response) {
                _this.jsonConfig.poll_answer = response.poll_answer;
                _this.jsonConfig.total = response.total;

                $.each(response.poll_answers, function(index, value) {
                    _this.jsonConfig.poll_answers[index] = value;
                });

                // xss-lint: disable=javascript-jquery-html
                questionEl.children('._poll_question_extracted_div').html(JSON.stringify(_this.jsonConfig));

                postInit(runtime, element);
            }    
        });
        
        return;
    } catch (err) {
        console.log(
            'ERROR: Invalid JSON config for poll ID "' + this.id + '".',
            'Error messsage: "' + err.message + '".'
        );
    }
   
}

require(['jquery', 'edx-ui-toolkit/js/utils/html-utils'], function ($, HtmlUtils) {

    function showAnswerGraph(poll_answers, total) {
         var totalValue;

         totalValue = parseFloat(total);
         if (isFinite(totalValue) === false) {
             return;
         }
     
         _this = this;
     
         $.each(poll_answers, function(index, value) {
             var numValue, percentValue;
     
             numValue = parseFloat(value);
             if (isFinite(numValue) === false) {
                 return;
             }
     
             percentValue = (numValue / totalValue) * 100.0;
     
             _this.answersObj[index].statsEl.show();
             // eslint-disable-next-line max-len
             _this.answersObj[index].numberEl.html(HtmlUtils.HTML('' + value + ' (' + percentValue.toFixed(1) + '%)').toString());
             _this.answersObj[index].percentEl.css({
                 width: '' + percentValue.toFixed(1) + '%'
             });
         });
     }
         
    window.showAnswerGraph = showAnswerGraph;
});


require(['jquery', 'edx-ui-toolkit/js/utils/html-utils'], function ($, HtmlUtils) {


});

function submitAnswer(runtime, answer, answerObj, element) {

    // Make sure that the user can answer a question only once.
    if (this.questionAnswered === true) {
        return;
    }
    this.questionAnswered = true;
    _this = this;
    answerObj.buttonEl.addClass('answered');
    
    var data = {
        answer: answer
    }

    try {
        // Send the data to the server as an AJAX request. Attach a callback that will
        // be fired on server's response.
        $.ajax({
            type: 'POST',
            url: runtime.handlerUrl(element, 'handle_submit_state'),
            data: JSON.stringify(data),
            success: function (response) {
                
                _this.showAnswerGraph(response.poll_answers, response.total);

                if (_this.canReset === true) {
                    _this.resetButton.show();
                }

                // Initialize Conditional constructors.
                if (_this.wrapperSectionEl !== null) {
                    $(_this.wrapperSectionEl).find('.xmodule_ConditionalModule').each(function(index, value) {
                        // eslint-disable-next-line no-new
                        new window.Conditional(value, _this.runtime, _this.id.replace(/^poll_/, ''));
                    });
                }
            }
        });

    return;
    } catch (err) {
        console.log(
            'Error messsage: "' + err.message + '".'
        );
    }
}

function submitReset(runtime, element) {
    
    _this = this;

    console.log('submit reset');
    const questionEl = $(element).find(blockIdentifier);
    // Send the data to the server as an AJAX request. Attach a callback that will
    // be fired on server's response.        
    $.ajax({
        type: 'POST',
        url: runtime.handleUrl(element, 'handle_reset_state'),
        data: JSON.stringify({}),
        success:  function(response) {
            console.log('success! response = ');
            console.log(response);

            if ((response.hasOwnProperty('status') !== true) || (typeof response.status !== 'string')
                || (response.status.toLowerCase() !== 'success')) {
                return;
            }

            _this.questionAnswered = false;
            questionEl.find('.button.answered').removeClass('answered');
            questionEl.find('.stats').hide();
            _this.resetButton.hide();

            // Initialize Conditional constructors. We will specify the third parameter as 'true'
            // notifying the constructor that this is a reset operation.
            if (_this.wrapperSectionEl !== null) {
                $(_this.wrapperSectionEl).find('.xmodule_ConditionalModule').each(function(index, value) {
                    // eslint-disable-next-line no-new
                    new window.Conditional(value, _this.runtime, _this.id.replace(/^poll_/, ''));
                });
            }
        }
    });
}

require(['jquery', 'edx-ui-toolkit/js/utils/html-utils'], function ($, HtmlUtils) {
    
    function postInit(runtime, element) {
            
            // Access this object inside inner functions.
            _this = this;            
            const questionEl = $(element).find(blockIdentifier);
            this.jsonConfig = JSON.parse(questionEl.children('._poll_question_extracted_div').html());
            if ((this.jsonConfig.poll_answer.length > 0) && (this.jsonConfig.answers.hasOwnProperty(this.jsonConfig.poll_answer) === false)
            ) {
                HtmlUtils.append(questionEl, HtmlUtils.joinHtml(
                    HtmlUtils.HTML('<h3>Error!</h3>'),
                    HtmlUtils.HTML(
                        '<p>XML data format changed. List of answers was modified, but poll data was not updated.</p>'
                    )
                ));
        
                return;
            }
        
            // Get the DOM id of the question.
            this.id = questionEl.attr('id');
        
            // Get the URL to which we will post the users answer to the question.
            // this.ajax_url = questionEl.data('ajax-url');
        
            this.questionHtmlMarkup = $('<div />').html(HtmlUtils.HTML(this.jsonConfig.question).toString()).text();
            questionEl.append(HtmlUtils.HTML(this.questionHtmlMarkup).toString());
        
            // When the user selects and answer, we will set this flag to true.
            this.questionAnswered = false;
        
            this.answersObj = {};
            this.shortVersion = true;
        
            $.each(this.jsonConfig.answers, function(index, value) {
                if (value.length >= 18) {
                    _this.shortVersion = false;
                }
            });
        
            $.each(this.jsonConfig.answers, function(index, value) {
                var answer;
        
                answer = {};
        
                _this.answersObj[index] = answer;
                answer.el = $('<div class="poll_answer"></div>');
        
                answer.questionEl = $('<div class="question"></div>');
                answer.buttonEl = $('<div class="button"></div>');
                answer.textEl = $('<div class="text"></div>');
                answer.questionEl.append(HtmlUtils.HTML(answer.buttonEl).toString());
                answer.questionEl.append(HtmlUtils.HTML(answer.textEl).toString());
        
                answer.el.append(HtmlUtils.HTML(answer.questionEl).toString());
        
                answer.statsEl = $('<div class="stats"></div>');
                answer.barEl = $('<div class="bar"></div>');
                answer.percentEl = $('<div class="percent"></div>');
                answer.barEl.append(HtmlUtils.HTML(answer.percentEl).toString());
                answer.numberEl = $('<div class="number"></div>');
                answer.statsEl.append(HtmlUtils.HTML(answer.barEl).toString());
                answer.statsEl.append(HtmlUtils.HTML(answer.numberEl).toString());
        
                answer.statsEl.hide();
        
                answer.el.append(HtmlUtils.HTML(answer.statsEl).toString());
        
                answer.textEl.html(HtmlUtils.HTML(value).toString());
        
                if (_this.shortVersion === true) {
                    // eslint-disable-next-line no-shadow
                    $.each(answer, function(index, value) {
                        if (value instanceof jQuery) {
                            value.addClass('short');
                        }
                    });
                }
        
                answer.el.appendTo(questionEl);
        
                answer.textEl.on('click', function() {                  
                    _this.submitAnswer(runtime, index, answer);
                });
        
                answer.buttonEl.on('click', function() {
                    _this.submitAnswer(runtime, index, element);
                });
        
                if (index === _this.jsonConfig.poll_answer) {
                    answer.buttonEl.addClass('answered');
                    _this.questionAnswered = true;
                }
            });
        
            console.log(this.jsonConfig.reset);
        
            if ((typeof this.jsonConfig.reset === 'string') && (this.jsonConfig.reset.toLowerCase() === 'true')) {
                this.canReset = true;
        
                this.resetButton = $('<div class="button reset-button">Change your vote</div>');
        
                if (this.questionAnswered === false) {
                    this.resetButton.hide();
                }
        
                HtmlUtils.append(questionEl, this.resetButton);
                this.resetButton.on('click', function() {
                    _this.submitReset();
                });
            } else {
                this.canReset = false;
            }
        
            // If it turns out that the user already answered the question, show the answers graph.
            if (this.questionAnswered === true) {
                this.showAnswerGraph(this.jsonConfig.poll_answers, this.jsonConfig.total);
            }
        }
    window.postInit = postInit;
});
