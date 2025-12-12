/**
 * ES2024 module for the core logic of the drag-and-drop XBlock.
 * This file handles the initialization and processing of each problem instance.
 */

// Import dependencies using ES module syntax.
// The '.js' extension is recommended for native browser modules.
import State from './state.js';
import configParser from './config_parser.js';
import Container from './container.js';
import BaseImage from './base_image.js';
import Scroller from './scroller.js';
import Draggables from './draggables.js';
import Targets from './targets.js';
import updateInput from './update_input.js';

/**
 * Processes a single drag-and-drop problem instance on the page.
 * This function reads the problem's configuration and sets up all interactive elements.
 * @param {number} index - The index of the element in the jQuery collection.
 * @param {HTMLElement} value - The DOM element for the problem container.
 */
function processProblem(index, value) {
    let problemId;
    let config;
    let state;

    if ($(value).attr('data-problem-processed') === 'true') {
        // This problem was already processed by us before, so we will skip it.
        return;
    }
    $(value).attr('data-problem-processed', 'true');

    problemId = $(value).attr('data-plain-id');
    if (typeof problemId !== 'string') {
        console.log('ERROR: Could not find the ID of the problem DOM element.');
        return;
    }

    try {
        config = JSON.parse($('#drag_and_drop_json_' + problemId).html());
    } catch (err) {
        console.log('ERROR: Could not parse the JSON configuration options.');
        console.log('Error message: "' + err.message + '".');
        return;
    }

    state = State(problemId);

    if (configParser(state, config) !== true) {
        console.log('ERROR: Could not make sense of the JSON configuration options.');
        return;
    }

    Container(state);
    BaseImage(state);

    // This self-executing function waits for the base image to load
    // before initializing the rest of the interactive components.
    (function addContent() {
        if (state.baseImageLoaded !== true) {
            setTimeout(addContent, 50);
            return;
        }

        Targets.initializeBaseTargets(state);
        Scroller(state);
        Draggables.init(state);
        state.updateArrowOpacity();

        // Update the input element, checking first that it is not filled with
        // an answer from the server.
        if (updateInput.check(state) === false) {
            updateInput.update(state);
        }
    }());
}

/**
 * The main initialization function for all drag-and-drop problems.
 * It finds all problem containers on the page and initializes each one.
 * This is the default export of the module.
 */
export default function Main() {
    // The polyfill for Array.prototype.every has been removed as it is standard
    // in all modern browsers and no longer needed.
    $('.drag_and_drop_problem_div').each(processProblem);
}
