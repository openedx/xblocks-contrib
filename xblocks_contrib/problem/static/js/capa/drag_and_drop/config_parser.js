/**
 * ES2024 module for parsing and validating the JSON configuration
 * for a drag-and-drop problem.
 */

// Helper function to check if an object has a specific string attribute.
function attrIsString(obj, attr) {
    if (!obj.hasOwnProperty(attr)) {
        console.log(`ERROR: Attribute "obj.${attr}" is not present.`);
        return false;
    }
    if (typeof obj[attr] !== 'string') {
        console.log(`ERROR: Attribute "obj.${attr}" is not a string.`);
        return false;
    }
    return true;
}

// Helper function to check and parse an integer attribute.
function attrIsInteger(obj, attr) {
    if (!obj.hasOwnProperty(attr)) {
        console.log(`ERROR: Attribute "obj.${attr}" is not present.`);
        return false;
    }

    const tempInt = parseInt(obj[attr], 10);
    if (!isFinite(tempInt)) {
        console.log(`ERROR: Attribute "obj.${attr}" is not an integer.`);
        return false;
    }

    obj[attr] = tempInt;
    return true;
}

// Helper function to check and parse a boolean attribute, with an optional default.
function attrIsBoolean(obj, attr, defaultVal) {
    if (!obj.hasOwnProperty(attr)) {
        if (defaultVal === undefined) {
            console.log(`ERROR: Attribute "obj.${attr}" is not present.`);
            return false;
        }
        obj[attr] = defaultVal;
        return true;
    }

    if (obj[attr] === '') {
        obj[attr] = defaultVal;
    } else if (obj[attr] === 'false' || obj[attr] === false) {
        obj[attr] = false;
    } else if (obj[attr] === 'true' || obj[attr] === true) {
        obj[attr] = true;
    } else {
        console.log(`ERROR: Attribute "obj.${attr}" is not a boolean.`);
        return false;
    }
    return true;
}

// Processes a target object to ensure it has the correct structure.
function processTarget(state, obj, pushToState = true) {
    if (
        !attrIsString(obj, 'id') ||
        !attrIsInteger(obj, 'w') ||
        !attrIsInteger(obj, 'h') ||
        !attrIsInteger(obj, 'x') ||
        !attrIsInteger(obj, 'y')
    ) {
        return false;
    }

    if (pushToState) {
        state.config.targets.push(obj);
    }
    return true;
}

// Processes a draggable item object to ensure it has the correct structure.
function processDraggable(state, obj) {
    if (
        !attrIsString(obj, 'id') ||
        !attrIsString(obj, 'icon') ||
        !attrIsString(obj, 'label') ||
        !attrIsBoolean(obj, 'can_reuse', false) ||
        !obj.hasOwnProperty('target_fields')
    ) {
        return false;
    }

    // Check that all targets in the 'target_fields' property are proper target objects.
    if (!obj.target_fields.every(targetObj => processTarget(state, targetObj, false))) {
        return false;
    }

    state.config.draggables.push(obj);
    return true;
}

function getDraggables(state, config) {
    if (!config.hasOwnProperty('draggables')) {
        console.log('ERROR: "config" does not have a property "draggables".');
        state.config.foundErrors = true;
    } else if (Array.isArray(config.draggables)) {
        // Use an arrow function for conciseness.
        config.draggables.every(draggable => {
            if (!processDraggable(state, draggable)) {
                state.config.foundErrors = true;
                return false; // Exit .every() loop
            }
            return true; // Continue
        });
    } else {
        console.log('ERROR: The type of config.draggables is not supported.');
        state.config.foundErrors = true;
    }
}

function getBaseImage(state, config) {
    if (!config.hasOwnProperty('base_image')) {
        console.log('ERROR: "config" does not have a property "base_image".');
        state.config.foundErrors = true;
    } else if (typeof config.base_image === 'string') {
        state.config.baseImage = config.base_image;
    } else {
        console.log('ERROR: Property config.base_image is not of type "string".');
        state.config.foundErrors = true;
    }
}

function getTargets(state, config) {
    if (!config.hasOwnProperty('targets')) {
        // Optional property, defaults to empty array. Not an error.
    } else if (Array.isArray(config.targets)) {
        config.targets.every(target => {
            if (!processTarget(state, target)) {
                state.config.foundErrors = true;
                return false; // Exit .every() loop
            }
            return true; // Continue
        });
    } else {
        console.log('ERROR: Property config.targets is not of a supported type.');
        state.config.foundErrors = true;
    }
}

function getOnePerTarget(state, config) {
    if (!config.hasOwnProperty('one_per_target')) {
        console.log('ERROR: "config" does not have a property "one_per_target".');
        state.config.foundErrors = true;
    } else if (typeof config.one_per_target === 'string') {
        const value = config.one_per_target.toLowerCase();
        if (value === 'true') {
            state.config.onePerTarget = true;
        } else if (value === 'false') {
            state.config.onePerTarget = false;
        } else {
            console.log('ERROR: Property config.one_per_target can either be "true", or "false".');
            state.config.foundErrors = true;
        }
    } else {
        console.log('ERROR: Property config.one_per_target is not of a supported type.');
        state.config.foundErrors = true;
    }
}

function getTargetOutline(state, config) {
    // Optional property, defaults to true.
    if (config.hasOwnProperty('target_outline')) {
        if (typeof config.target_outline === 'string') {
            const value = config.target_outline.toLowerCase();
            if (value === 'true') {
                state.config.targetOutline = true;
            } else if (value === 'false') {
                state.config.targetOutline = false;
            } else {
                console.log('ERROR: Property config.target_outline can either be "true", or "false".');
                state.config.foundErrors = true;
            }
        } else {
            console.log('ERROR: Property config.target_outline is not of a supported type.');
            state.config.foundErrors = true;
        }
    }
}

function getLabelBgColor(state, config) {
    // Optional property, defaults to '#d6d6d6'.
    if (config.hasOwnProperty('label_bg_color')) {
        if (typeof config.label_bg_color === 'string') {
            state.config.labelBgColor = config.label_bg_color;
        } else {
            console.log('ERROR: Property config.label_bg_color is not of a supported type.');
        }
    }
}

function setIndividualTargets(state) {
    state.config.individualTargets = state.config.targets.length > 0;
}

/**
 * Parses and validates the configuration object for a drag-and-drop problem.
 * @param {object} state - The shared state object to populate.
 * @param {object} config - The raw configuration object from the server.
 * @returns {boolean} - True if parsing is successful, false otherwise.
 */
function configParser(state, config) {
    state.config = {
        draggables: [],
        baseImage: '',
        targets: [],
        onePerTarget: null,
        targetOutline: true,
        labelBgColor: '#d6d6d6',
        individualTargets: null,
        foundErrors: false,
    };

    getDraggables(state, config);
    getBaseImage(state, config);
    getTargets(state, config);
    getOnePerTarget(state, config);
    getTargetOutline(state, config);
    getLabelBgColor(state, config);
    setIndividualTargets(state);

    return !state.config.foundErrors;
}

export default configParser;
