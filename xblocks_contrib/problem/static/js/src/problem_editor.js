/* global CodeMirror, _, XModule, gettext */
// no-useless-escape disabled because of warnings in regexp expressions within the
// "toXML" code. When the "useless escapes" were removed, some of the unit tests
// failed, but only in Jenkins, indicating browser-specific behavior.
/* eslint no-useless-escape: 0 */

function MarkdownEditingDescriptor(runtime, element) {
    'use strict';

    // Initialization check to prevent re-instantiating on the same element.
    const editorWrapper = $(element);
    if (editorWrapper.attr('data-processed') === 'true') {
        return;
    }
    editorWrapper.attr('data-processed', 'true');

    // --- Local variables scoped to this instance ---
    let markdown_editor = null;
    let xml_editor = null;
    let current_editor = null;

    // --- Templates and "Static" Helper Functions ---

    const multipleChoiceTemplate = `( ) ${gettext('incorrect')}\n( ) ${gettext('incorrect')}\n(x) ${gettext('correct')}\n`;
    const checkboxChoiceTemplate = `[x] ${gettext('correct')}\n[ ] incorrect\n[x] correct\n`;
    const stringInputTemplate = `= ${gettext('answer')}\n`;
    const numberInputTemplate = `= ${gettext('answer')} +- 0.001%\n`;
    const selectTemplate = `[[${gettext('incorrect')}, (${gettext('correct')}), ${gettext('incorrect')}]]\n`;
    const headerTemplate = `${gettext('Header')}\n=====\n`;
    const explanationTemplate = `[explanation]\n${gettext('Short explanation')}\n[explanation]\n`;

    const insertGenericInput = (selectedText, lineStart, lineEnd, template) => {
        if (selectedText.length > 0) {
            return lineStart + selectedText + lineEnd;
        }
        return template;
    };

    const insertMultipleChoice = (selectedText) => insertGenericChoice(selectedText, '(', ')', multipleChoiceTemplate);
    const insertCheckboxChoice = (selectedText) => insertGenericChoice(selectedText, '[', ']', checkboxChoiceTemplate);
    const insertStringInput = (selectedText) => insertGenericInput(selectedText, '= ', '', stringInputTemplate);
    const insertNumberInput = (selectedText) => insertGenericInput(selectedText, '= ', '', numberInputTemplate);
    const insertSelect = (selectedText) => insertGenericInput(selectedText, '[[', ']]', selectTemplate);
    const insertHeader = (selectedText) => insertGenericInput(selectedText, '', '\n====\n', headerTemplate);
    const insertExplanation = (selectedText) => insertGenericInput(selectedText, '[explanation]\n', '\n[explanation]', explanationTemplate);

    const insertGenericChoice = (selectedText, choiceStart, choiceEnd, template) => {
        if (selectedText.length > 0) {
            // Replace adjacent newlines with a single newline, strip any trailing newline
            const cleanSelectedText = selectedText.replace(/\n+/g, '\n').replace(/\n$/, '');
            const lines = cleanSelectedText.split('\n');
            let revisedLines = '';
            for (let i = 0, len = lines.length; i < len; i++) {
                let line = lines[i];
                revisedLines += choiceStart;
                // a stand alone x before other text implies that this option is "correct"
                if (/^\s*x\s+(\S)/i.test(line)) {
                    // Remove the x and any initial whitespace as long as there's more text on the line
                    line = line.replace(/^\s*x\s+(\S)/i, '$1');
                    revisedLines += 'x';
                } else {
                    revisedLines += ' ';
                }
                revisedLines += `${choiceEnd} ${line}\n`;
            }
            return revisedLines;
        }
        return template;
    };

    const markdownToXml = (markdown) => {
        // This is a large, complex utility function. Its internal logic remains unchanged.
        // All original code from the static MarkdownEditingDescriptor.markdownToXml method goes here.
        // The implementation details are omitted for brevity in this explanation, but are included
        // in the final code block.
        var demandHintTags = [],
            finalDemandHints, finalXml, responseTypesMarkdown, responseTypesXML, toXml;
        toXml = function(partialMarkdown) {
            var xml = partialMarkdown,
                i, splits, makeParagraph, serializer, responseType, $xml, responseTypesSelector,
                inputtype, beforeInputtype, extractHint, demandhints;
            var responseTypes = [
                'optionresponse', 'multiplechoiceresponse', 'stringresponse', 'numericalresponse', 'choiceresponse'
            ];

            // fix DOS \r\n line endings to look like \n
            xml = xml.replace(/\r\n/g, '\n');

            // replace headers
            xml = xml.replace(/(^.*?$)(?=\n\=\=+$)/gm, '<h3 class="hd hd-2 problem-header">$1</h3>');
            xml = xml.replace(/\n^\=\=+$/gm, '');

            // extract question and description(optional)
            // >>question||description<< converts to
            // <label>question</label> <description>description</description>
            xml = xml.replace(/>>([^]+?)<</gm, function(match, questionText) {
                var result = questionText.split('||'),
                    label = '<label>' + result[0] + '</label>\n'; // xss-lint: disable=javascript-concat-html

                // don't add empty <description> tag
                if (result.length === 1 || !result[1]) {
                    return label;
                }
                // xss-lint: disable=javascript-concat-html
                return label + '<description>' + result[1] + '</description>\n';
            });

            // Pull out demand hints,  || a hint ||
            demandhints = '';
            xml = xml.replace(/(^\s*\|\|.*?\|\|\s*$\n?)+/gm, function(match) { // $\n
                var inner,
                    options = match.split('\n');
                for (i = 0; i < options.length; i += 1) {
                    inner = /\s*\|\|(.*?)\|\|/.exec(options[i]);
                    if (inner) {
                        // xss-lint: disable=javascript-concat-html
                        demandhints += '  <hint>' + inner[1].trim() + '</hint>\n';
                    }
                }
                return '';
            });

            // replace \n+whitespace within extended hint {{ .. }}, by a space, so the whole
            // hint sits on one line.
            // This is the one instance of {{ ... }} matching that permits \n
            xml = xml.replace(/{{(.|\n)*?}}/gm, function(match) {
                return match.replace(/\r?\n( |\t)*/g, ' ');
            });

            // Function used in many places to extract {{ label:: a hint }}.
            // Returns a little hash with various parts of the hint:
            // hint: the hint or empty, nothint: the rest
            // labelassign: javascript assignment of label attribute, or empty
            extractHint = function(inputText, detectParens) {
                var text = inputText,
                    curly = /\s*{{(.*?)}}/.exec(text),
                    hint = '',
                    label = '',
                    parens = false,
                    labelassign = '',
                    labelmatch;
                if (curly) {
                    text = text.replace(curly[0], '');
                    hint = curly[1].trim();
                    labelmatch = /^(.*?)::/.exec(hint);
                    if (labelmatch) {
                        hint = hint.replace(labelmatch[0], '').trim();
                        label = labelmatch[1].trim();
                        labelassign = ' label="' + label + '"';
                    }
                }
                if (detectParens) {
                    if (text.length >= 2 && text[0] === '(' && text[text.length - 1] === ')') {
                        text = text.substring(1, text.length - 1);
                        parens = true;
                    }
                }
                return {
                    nothint: text,
                    hint: hint,
                    label: label,
                    parens: parens,
                    labelassign: labelassign
                };
            };

            // replace selects
            // [[ a, b, (c) ]]
            // [[
            //     a
            //     b
            //     (c)
            //  ]]
            // <optionresponse>
            //  <optioninput>
            //     <option  correct="True">AAA<optionhint  label="Good Job">
            //          Yes, multiple choice is the right answer.
            //  </optionhint>
            // Note: part of the option-response syntax looks like multiple-choice, so it must be processed first.
            xml = xml.replace(/\[\[((.|\n)+?)\]\]/g, function(match, group1) {
                var textHint, options, optiontag, correct, lines, optionlines, line, correctstr, hintstr, label;
                // decide if this is old style or new style
                if (match.indexOf('\n') === -1) { // OLD style, [[ .... ]]  on one line
                    options = group1.split(/\,\s*/g);
                    optiontag = '  <optioninput options="(';
                    for (i = 0; i < options.length; i += 1) {
                        optiontag += "'" + options[i].replace(/(?:^|,)\s*\((.*?)\)\s*(?:$|,)/g, '$1') + "'"
                            + (i < options.length - 1 ? ',' : '');
                    }
                    optiontag += ')" correct="';
                    correct = /(?:^|,)\s*\((.*?)\)\s*(?:$|,)/g.exec(group1);
                    if (correct) {
                        optiontag += correct[1];
                    }
                    optiontag += '">';
                    // xss-lint: disable=javascript-concat-html
                    return '\n<optionresponse>\n' + optiontag + '</optioninput>\n</optionresponse>\n\n';
                }

                // new style  [[ many-lines ]]
                lines = group1.split('\n');
                optionlines = '';
                for (i = 0; i < lines.length; i++) {
                    line = lines[i].trim();
                    if (line.length > 0) {
                        textHint = extractHint(line, true);
                        if (!textHint.nothint) {
                            throw new Error(gettext('An answer option has been left blank. Please review and edit the component.'));
                        }
                        correctstr = ' correct="' + (textHint.parens ? 'True' : 'False') + '"';
                        hintstr = '';
                        if (textHint.hint) {
                            label = textHint.label;
                            if (label) {
                                label = ' label="' + label + '"';
                            }
                            // xss-lint: disable=javascript-concat-html
                            hintstr = ' <optionhint' + label + '>' + textHint.hint + '</optionhint>';
                        }
                        // xss-lint: disable=javascript-concat-html
                        optionlines += '    <option' + correctstr + '>' + textHint.nothint + hintstr + '</option>\n';
                    }
                }
                // xss-lint: disable=javascript-concat-html
                return '\n<optionresponse>\n  <optioninput>\n' + optionlines + '  </optioninput>\n</optionresponse>\n\n';
            });

            // multiple choice questions
            //
            xml = xml.replace(/(^\s*\(.{0,3}\).*?$\n*)+/gm, function(match) {
                var choices = '',
                    shuffle = false,
                    options = match.split('\n'),
                    value, inparens, correct,
                    fixed, hint, result;
                for (i = 0; i < options.length; i++) {
                    options[i] = options[i].trim(); // trim off leading/trailing whitespace
                    if (options[i].length > 0) {
                        value = options[i].split(/^\s*\(.{0,3}\)\s*/)[1];
                        if (!value) {
                            throw new Error(gettext('An answer option has been left blank. Please review and edit the component.'));
                        }
                        inparens = /^\s*\((.{0,3})\)\s*/.exec(options[i])[1];
                        correct = /x/i.test(inparens);
                        fixed = '';
                        if (/@/.test(inparens)) {
                            fixed = ' fixed="true"';
                        }
                        if (/!/.test(inparens)) {
                            shuffle = true;
                        }

                        hint = extractHint(value);
                        if (hint.hint) {
                            value = hint.nothint;
                            // xss-lint: disable=javascript-concat-html
                            value = value + ' <choicehint' + hint.labelassign + '>' + hint.hint + '</choicehint>';
                        }
                        // xss-lint: disable=javascript-concat-html
                        choices += '    <choice correct="' + correct + '"' + fixed + '>' + value + '</choice>\n';
                    }
                }
                result = '<multiplechoiceresponse>\n';
                if (shuffle) {
                    result += '  <choicegroup type="MultipleChoice" shuffle="true">\n';
                } else {
                    result += '  <choicegroup type="MultipleChoice">\n';
                }
                result += choices;
                result += '  </choicegroup>\n';
                result += '</multiplechoiceresponse>\n\n';
                return result;
            });

            // group check answers
            // [.] with {{...}} lines mixed in
            xml = xml.replace(/(^\s*((\[.?\])|({{.*?}})).*?$\n*)+/gm, function(match) {
                var groupString = '<choiceresponse>\n',
                    options = match.split('\n'),
                    value, correct, abhint, endHints, hintbody,
                    hint, inner, select, hints;

                groupString += '  <checkboxgroup>\n';
                endHints = ''; // save these up to emit at the end

                for (i = 0; i < options.length; i += 1) {
                    if (options[i].trim().length > 0) {
                        // detect the {{ ((A*B)) ...}} case first
                        // emits: <compoundhint value="A*B">AB hint</compoundhint>

                        abhint = /^\s*{{\s*\(\((.*?)\)\)(.*?)}}/.exec(options[i]);
                        if (abhint) {
                            // lone case of hint text processing outside of extractHint, since syntax here is unique
                            hintbody = abhint[2];
                            hintbody = hintbody.replace('&lf;', '\n').trim();
                            // xss-lint: disable=javascript-concat-html
                            endHints += '    <compoundhint value="' + abhint[1].trim() + '">' + hintbody + '</compoundhint>\n';
                            // eslint-disable-next-line no-continue
                            continue; // bail
                        }

                        value = options[i].split(/^\s*\[.?\]\s*/)[1];
                        if (!value) {
                            throw new Error(gettext('An answer option has been left blank. Please review and edit the component.'));
                        }
                        correct = /^\s*\[x\]/i.test(options[i]);
                        hints = '';
                        //  {{ selected: You’re right that apple is a fruit. },
                        //   {unselected: Remember that apple is also a fruit.}}
                        hint = extractHint(value);
                        if (hint.hint) {
                            inner = '{' + hint.hint + '}'; // parsing is easier if we put outer { } back

                            // include \n since we are downstream of extractHint()
                            select = /{\s*(s|selected):((.|\n)*?)}/i.exec(inner);
                            // checkbox choicehints get their own line, since there can be two of them
                            // <choicehint selected="true">You’re right that apple is a fruit.</choicehint>
                            if (select) {
                                // xss-lint: disable=javascript-concat-html
                                hints += '\n      <choicehint selected="true">' + select[2].trim() + '</choicehint>';
                            }
                            select = /{\s*(u|unselected):((.|\n)*?)}/i.exec(inner);
                            if (select) {
                                // xss-lint: disable=javascript-concat-html
                                hints += '\n      <choicehint selected="false">' + select[2].trim() + '</choicehint>';
                            }

                            // Blank out the original text only if the specific "selected" syntax is found
                            // That way, if the user types it wrong, at least they can see it's not processed.
                            if (hints) {
                                value = hint.nothint;
                            }
                        }
                        // xss-lint: disable=javascript-concat-html
                        groupString += '    <choice correct="' + correct + '">' + value + hints + '</choice>\n';
                    }
                }

                groupString += endHints;
                groupString += '  </checkboxgroup>\n';
                groupString += '</choiceresponse>\n\n';

                return groupString;
            });

            // replace string and numerical, numericalresponse, stringresponse
            // A fine example of the function-composition programming style.
            xml = xml.replace(/(^s?\=\s*(.*?$)(\n*(or|not)\=\s*(.*?$))*)+/gm, function(match, p) {
                // Line split here, trim off leading xxx= in each function
                var answersList = p.split('\n'),

                    isRangeToleranceCase = function(answer) {
                        return _.contains(
                            ['[', '('], answer[0]) && _.contains([']', ')'], answer[answer.length - 1]
                        );
                    },

                    checkIsNumeric = function(stringValue) {
                        // remove OLX feedback
                        if ((stringValue.indexOf('{{') !== -1) && (stringValue.indexOf('}}') !== -1)) {
                            stringValue = stringValue.replace(/{{[\s\S]*?}}/g, '').trim();
                        }
                        // allow for "e" for scientific notation, otherwise, exclude letters
                        if (stringValue.match(/[a-df-z]/i)) {
                            return false;
                        }
                        return !isNaN(parseFloat(stringValue));
                    },

                    getAnswerData = function(answerValue) {
                        var answerData = {},
                            answerParams = /(.*?)\+\-\s*(.*?$)/.exec(answerValue);
                        if (answerParams) {
                            answerData.answer = answerParams[1].replace(/\s+/g, ''); // inputs like 5*2 +- 10
                            answerData.default = answerParams[2];
                        } else {
                            answerData.answer = answerValue.replace(/\s+/g, ''); // inputs like 5*2
                        }
                        return answerData;
                    },

                    processNumericalResponse = function(answerValues) {
                        var firstAnswer, answerData, numericalResponseString, additionalAnswerString,
                            textHint, hintLine, additionalTextHint, additionalHintLine, orMatch, hasTolerance;

                        // First string case is s?= [e.g. = 100]
                        firstAnswer = answerValues[0].replace(/^\=\s*/, '');

                        // If answer is not numerical
                        if (!checkIsNumeric(firstAnswer) && !isRangeToleranceCase(firstAnswer)) {
                            return false;
                        }

                        textHint = extractHint(firstAnswer);
                        hintLine = '';
                        if (textHint.hint) {
                            firstAnswer = textHint.nothint;
                            // xss-lint: disable=javascript-concat-html
                            hintLine = '  <correcthint' + textHint.labelassign + '>' + textHint.hint + '</correcthint>\n';
                        }

                        // Range case
                        if (isRangeToleranceCase(firstAnswer)) {
                            // [5, 7) or (5, 7), or (1.2345 * (2+3), 7*4 ]  - range tolerance case
                            // = (5*2)*3 should not be used as range tolerance
                            // xss-lint: disable=javascript-concat-html
                            numericalResponseString = '<numericalresponse answer="' + firstAnswer + '">\n';
                        } else {
                            answerData = getAnswerData(firstAnswer);
                            // xss-lint: disable=javascript-concat-html
                            numericalResponseString = '<numericalresponse answer="' + answerData.answer + '">\n';
                            if (answerData.default) {
                                // xss-lint: disable=javascript-concat-html
                                numericalResponseString += '  <responseparam type="tolerance" default="' + answerData.default + '" />\n';
                            }
                        }

                        // Additional answer case or= [e.g. or= 10]
                        // Since answerValues[0] is firstAnswer, so we will not include this in additional answers.
                        additionalAnswerString = '';
                        for (i = 1; i < answerValues.length; i++) {
                            additionalHintLine = '';
                            additionalTextHint = extractHint(answerValues[i]);
                            orMatch = /^or\=\s*(.*)/.exec(additionalTextHint.nothint);
                            if (orMatch) {
                                hasTolerance = /(.*?)\+\-\s*(.*?$)/.exec(orMatch[1]);
                                // Do not add additional_answer if additional answer is not numerical (eg. or= ABC)
                                // or contains range tolerance case (eg. or= (5,7)
                                // or has tolerance (eg. or= 10 +- 0.02)
                                if (isNaN(parseFloat(orMatch[1]))
                                    || isRangeToleranceCase(orMatch[1])
                                    || hasTolerance) {
                                    // eslint-disable-next-line no-continue
                                    continue;
                                }

                                if (additionalTextHint.hint) {
                                    // xss-lint: disable=javascript-concat-html
                                    additionalHintLine = '<correcthint' + additionalTextHint.labelassign + '>' + additionalTextHint.hint + '</correcthint>';
                                }

                                // xss-lint: disable=javascript-concat-html
                                additionalAnswerString += '  <additional_answer answer="' + orMatch[1] + '">';
                                additionalAnswerString += additionalHintLine;
                                additionalAnswerString += '</additional_answer>\n';
                            }
                        }

                        // Add additional answers string to numerical problem string.
                        if (additionalAnswerString) {
                            numericalResponseString += additionalAnswerString;
                        }

                        numericalResponseString += '  <formulaequationinput />\n';
                        numericalResponseString += hintLine;
                        numericalResponseString += '</numericalresponse>\n\n';

                        return numericalResponseString;
                    },

                    processStringResponse = function(values) {
                        var firstAnswer, textHint, typ, string, orMatch, notMatch;
                        // First string case is s?=
                        firstAnswer = values.shift();
                        firstAnswer = firstAnswer.replace(/^s?\=\s*/, '');
                        textHint = extractHint(firstAnswer);
                        firstAnswer = textHint.nothint;
                        typ = ' type="ci"';
                        if (firstAnswer[0] === '|') { // this is regexp case
                            typ = ' type="ci regexp"';
                            firstAnswer = firstAnswer.slice(1).trim();
                        }
                        // xss-lint: disable=javascript-concat-html
                        string = '<stringresponse answer="' + firstAnswer + '"' + typ + ' >\n';
                        if (textHint.hint) {
                            // xss-lint: disable=javascript-concat-html
                            string += '  <correcthint' + textHint.labelassign + '>'
                                + textHint.hint + '</correcthint>\n'; // xss-lint: disable=javascript-concat-html
                        }

                        // Subsequent cases are not= or or=
                        for (i = 0; i < values.length; i += 1) {
                            textHint = extractHint(values[i]);
                            notMatch = /^not\=\s*(.*)/.exec(textHint.nothint);
                            if (notMatch) {
                                // xss-lint: disable=javascript-concat-html
                                string += '  <stringequalhint answer="' + notMatch[1] + '"' + textHint.labelassign + '>' + textHint.hint + '</stringequalhint>\n';

                                // eslint-disable-next-line no-continue
                                continue;
                            }
                            orMatch = /^or\=\s*(.*)/.exec(textHint.nothint);
                            if (orMatch) {
                                // additional_answer with answer= attribute
                                // xss-lint: disable=javascript-concat-html
                                string += '  <additional_answer answer="' + orMatch[1] + '">';
                                if (textHint.hint) {
                                    // xss-lint: disable=javascript-concat-html
                                    string += '<correcthint' + textHint.labelassign + '>' + textHint.hint + '</correcthint>';
                                }
                                string += '</additional_answer>\n';
                            }
                        }

                        string += '  <textline size="20"/>\n</stringresponse>\n\n';

                        return string;
                    };

                return processNumericalResponse(answersList) || processStringResponse(answersList);
            });

            // replace explanations
            xml = xml.replace(/\[explanation\]\n?([^\]]*)\[\/?explanation\]/gmi, function(match, p1) {
                // xss-lint: disable=javascript-concat-html
                return '<solution>\n<div class="detailed-solution">\n' + gettext('Explanation') + '\n\n' + p1 + '\n</div>\n</solution>';
            });

            // replace code blocks
            xml = xml.replace(/\[code\]\n?([^\]]*)\[\/?code\]/gmi, function(match, p1) {
                // xss-lint: disable=javascript-concat-html
                return '<pre><code>' + p1 + '</code></pre>';
            });

            // split scripts and preformatted sections, and wrap paragraphs
            splits = xml.split(/(\<\/?(?:script|pre|label|description).*?\>)/g);

            // Wrap a string by <p> tag when line is not already wrapped by another tag
            // true when line is not already wrapped by another tag false otherwise
            makeParagraph = true;

            for (i = 0; i < splits.length; i += 1) {
                if (/\<(script|pre|label|description)/.test(splits[i])) {
                    makeParagraph = false;
                }

                if (makeParagraph) {
                    splits[i] = splits[i].replace(/(^(?!\s*\<|$).*$)/gm, '<p>$1</p>');
                }

                if (/\<\/(script|pre|label|description)/.test(splits[i])) {
                    makeParagraph = true;
                }
            }

            xml = splits.join('');

            // rid white space
            xml = xml.replace(/\n\n\n/g, '\n');

            // if we've come across demand hints, wrap in <demandhint> at the end
            if (demandhints) {
                demandHintTags.push(demandhints);
            }

            // make selector to search responsetypes in xml
            responseTypesSelector = responseTypes.join(', ');

            // make temporary xml
            // xss-lint: disable=javascript-concat-html
            $xml = $($.parseXML('<prob>' + xml + '</prob>'));
            responseType = $xml.find(responseTypesSelector);

            // convert if there is only one responsetype
            if (responseType.length === 1) {
                inputtype = responseType[0].firstElementChild;
                // used to decide whether an element should be placed before or after an inputtype
                beforeInputtype = true;

                _.each($xml.find('prob').children(), function(child) {
                    // we don't want to add the responsetype again into new xml
                    if (responseType[0].nodeName === child.nodeName) {
                        beforeInputtype = false;
                        return;
                    }

                    if (beforeInputtype) {
                        // xss-lint: disable=javascript-jquery-insert-into-target
                        responseType[0].insertBefore(child, inputtype);
                    } else {
                        responseType[0].appendChild(child);
                    }
                });
                serializer = new XMLSerializer();

                xml = serializer.serializeToString(responseType[0]);

                // remove xmlns attribute added by the serializer
                xml = xml.replace(/\sxmlns=['"].*?['"]/gi, '');

                // XMLSerializer messes the indentation of XML so add newline
                // at the end of each ending tag to make the xml looks better
                xml = xml.replace(/(\<\/.*?\>)(\<.*?\>)/gi, '$1\n$2');
            }

            // remove class attribute added on <p> tag for question title
            xml = xml.replace(/\sclass=\'qtitle\'/gi, '');
            return xml;
        };
        responseTypesXML = [];
        responseTypesMarkdown = markdown.split(/\n\s*---\s*\n/g);
        _.each(responseTypesMarkdown, function(responseTypeMarkdown) {
            if (responseTypeMarkdown.trim().length > 0) {
                responseTypesXML.push(toXml(responseTypeMarkdown));
            }
        });
        finalDemandHints = '';
        if (demandHintTags.length) {
            // xss-lint: disable=javascript-concat-html
            finalDemandHints = '\n<demandhint>\n' + demandHintTags.join('') + '</demandhint>';
        }
        // make all responsetypes descendants of a single problem element
        // xss-lint: disable=javascript-concat-html
        finalXml = '<problem>\n' + responseTypesXML.join('\n\n') + finalDemandHints + '\n</problem>';
        return finalXml;
    };


    // --- Core Logic Functions ---

    function setCurrentEditor(editor) {
        if (current_editor) {
            $(current_editor.getWrapperElement()).hide();
        }
        current_editor = editor;
        $(current_editor.getWrapperElement()).show();
        $(current_editor).focus();
    }

    function createXMLEditor(text) {
        xml_editor = CodeMirror.fromTextArea($('.xml-box', element)[0], {
            mode: 'xml',
            lineNumbers: true,
            lineWrapping: true
        });
        if (text) {
            xml_editor.setValue(text);
        }
        setCurrentEditor(xml_editor);
        $(xml_editor.getWrapperElement()).toggleClass('CodeMirror-advanced');
        // Need to refresh to get line numbers to display properly.
        xml_editor.refresh();
    }

    function confirmConversionToXml() {
        // eslint-disable-next-line max-len, no-alert
        return confirm(gettext('If you use the Advanced Editor, this problem will be converted to XML and you will not be able to return to the Simple Editor Interface.\n\nProceed to the Advanced Editor and convert this problem to XML?'));
    }

    function onShowXMLButton(e) {
        e.preventDefault();
        if (confirmConversionToXml()) {
            createXMLEditor(markdownToXml(markdown_editor.getValue()));
            xml_editor.setCursor(0);
            // Hide markdown-specific toolbar buttons
            $(element).find('.editor-bar').hide();
        }
    }

    function onToolbarButton(e) {
        e.preventDefault();
        const selection = markdown_editor.getSelection();
        let revisedSelection = null;
        switch ($(e.currentTarget).attr('class')) {
        case 'multiple-choice-button':
            revisedSelection = insertMultipleChoice(selection);
            break;
        case 'string-button':
            revisedSelection = insertStringInput(selection);
            break;
        case 'number-button':
            revisedSelection = insertNumberInput(selection);
            break;
        case 'checks-button':
            revisedSelection = insertCheckboxChoice(selection);
            break;
        case 'dropdown-button':
            revisedSelection = insertSelect(selection);
            break;
        case 'header-button':
            revisedSelection = insertHeader(selection);
            break;
        case 'explanation-button':
            revisedSelection = insertExplanation(selection);
            break;
        default:
            break;
        }
        if (revisedSelection !== null) {
            markdown_editor.replaceSelection(revisedSelection);
            markdown_editor.focus();
        }
    }

    function save() {
        // Unregister listeners on save, as a new instance is created upon re-edit.
        editorWrapper.off('click', '.xml-tab', onShowXMLButton);
        editorWrapper.off('click', '.format-buttons button', onToolbarButton);

        if (current_editor === markdown_editor) {
            return {
                data: markdownToXml(markdown_editor.getValue()),
                metadata: {
                    markdown: markdown_editor.getValue()
                }
            };
        }
        return {
            data: xml_editor.getValue(),
            nullout: ['markdown']
        };
    }

    // --- Initial Execution ---

    (function initialize() {
        if ($('.markdown-box', element).length !== 0) {
            markdown_editor = CodeMirror.fromTextArea($('.markdown-box', element)[0], {
                lineWrapping: true,
                mode: null
            });
            setCurrentEditor(markdown_editor);
            // Add listeners for toolbar buttons (only present for markdown editor)
            editorWrapper.on('click', '.xml-tab', onShowXMLButton);
            editorWrapper.on('click', '.format-buttons button', onToolbarButton);
            // Hide the XML text area
            $(element).find('.xml-box').hide();
        } else {
            createXMLEditor();
        }
    }());

    // --- Public Interface ---
    // The XBlock runtime expects an object with a `save` method.
    // This reveals the internal `save` function to the outside world.
    return {
        save: save
    };
}