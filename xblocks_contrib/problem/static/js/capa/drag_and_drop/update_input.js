/**
 * Recursively builds a nested object representing the hierarchy of draggables on targets.
 * @param {object} tempObj - The object being built.
 * @param {object} draggable - The current draggable.
 * @param {object} target - The target the draggable is on.
 */
function addTargetRecursively(tempObj, draggable, target) {
    if (target.type === 'base') {
        tempObj[draggable.id] = target.id;
    } else {
        tempObj[draggable.id] = {};
        tempObj[draggable.id][target.id] = {};
        addTargetRecursively(tempObj[draggable.id][target.id], target.draggableObj, target.draggableObj.onTarget);
    }
}

/**
 * Finds a draggable or target by its ID based on various conditions.
 * @param {object} state - The shared state object.
 * @param {string} type - The type of item to search for ('draggables' or 'targets').
 * @param {string} id - The ID of the item.
 * @param {boolean|null} fromTargetField - Scoping for targets.
 * @param {boolean|null} inContainer - Scoping for draggables.
 * @param {string|null} targetId - Scoping for draggables.
 * @param {string|null} baseDraggableId - Scoping for draggables on other draggables.
 * @param {string|null} baseTargetId - Scoping for draggables on other draggables.
 * @returns {object|null} The found item or null.
 */
function getById(state, type, id, fromTargetField, inContainer, targetId, baseDraggableId, baseTargetId) {
    for (const item of state[type]) {
        if (type === 'draggables') {
            if (targetId !== undefined && inContainer === false && baseDraggableId !== undefined && baseTargetId !== undefined) {
                if (
                    (item.id === id) &&
                    (item.inContainer === false) &&
                    (item.onTarget.id === targetId) &&
                    (item.onTarget.type === 'on_drag') &&
                    (item.onTarget.draggableObj.id === baseDraggableId) &&
                    (item.onTarget.draggableObj.onTarget.id === baseTargetId)
                ) {
                    return item;
                }
            } else if (targetId !== undefined && inContainer === false) {
                if (
                    (item.id === id) &&
                    (item.inContainer === false) &&
                    (item.onTarget.id === targetId)
                ) {
                    return item;
                }
            } else if (inContainer === false) {
                if ((item.id === id) && (item.inContainer === false)) {
                    return item;
                }
            } else if ((item.id === id) && (item.inContainer === true)) {
                return item;
            }
        } else { // 'targets'
            if (fromTargetField === true) {
                if ((item.id === id) && (item.type === 'on_drag')) {
                    return item;
                }
            } else if ((item.id === id) && (item.type === 'base')) {
                return item;
            }
        }
    }
    return null;
}

/**
 * Creates a draggable on a target based on saved answer data.
 * @param {object} state - The shared state object.
 * @param {string} draggableId - The ID of the draggable to create.
 * @param {string} targetId - The ID of the target to place it on.
 * @param {boolean} reportError - Whether to log errors.
 * @param {function} funcCallback - Callback to run after moving.
 * @returns {boolean} Success status.
 */
function createBaseDraggableOnTarget(state, draggableId, targetId, reportError, funcCallback) {
    const draggable = getById(state, 'draggables', draggableId);
    if (!draggable) {
        if (reportError !== false) {
            console.log(`ERROR: In answer there exists a draggable ID "${draggableId}". No draggable with this ID could be found.`);
        }
        return false;
    }

    const target = getById(state, 'targets', targetId);
    if (!target) {
        if (reportError !== false) {
            console.log(`ERROR: In answer there exists a target ID "${targetId}". No target with this ID could be found.`);
        }
        return false;
    }

    draggable.moveDraggableTo('target', target, funcCallback);
    return true;
}

/**
 * Repositions draggables that are not on specific targets (i.e., on the base image).
 * @param {object} state - The shared state object.
 * @param {Array} answer - The array of position data.
 */
function processAnswerPositions(state, answer) {
    for (const answerItem of answer) {
        for (const draggableId in answerItem) {
            if (Object.prototype.hasOwnProperty.call(answerItem, draggableId)) {
                const draggable = getById(state, 'draggables', draggableId);
                if (!draggable) {
                    console.log(`ERROR: In answer there exists a draggable ID "${draggableId}". No draggable with this ID could be found.`);
                    continue;
                }
                draggable.moveDraggableTo('XY', {
                    x: answerItem[draggableId][0],
                    y: answerItem[draggableId][1],
                });
            }
        }
    }
}

/**
 * Processes the nested structure of answers where draggables are on targets.
 * @param {object} state - The shared state object.
 * @param {object} answerSortedByDepth - The answer data, presorted by nesting depth.
 * @param {number} depth - The current depth level to process.
 * @param {number} i - The index within the current depth level.
 */
function processAnswerTargets(state, answerSortedByDepth, depth, i) {
    if (depth === 0) {
        return; // We are at the lowest depth. The end.
    }
    if (!answerSortedByDepth[depth]) {
        processAnswerTargets(state, answerSortedByDepth, depth - 1, 0); // Invalid depth, go down one level.
        return;
    }
    if (answerSortedByDepth[depth].length <= i) {
        processAnswerTargets(state, answerSortedByDepth, depth - 1, 0); // Ran out of answers at this depth, go down.
        return;
    }

    const chain = answerSortedByDepth[depth][i];
    let baseDraggableId = Object.keys(chain)[0];
    let baseTargetId;
    let layeredDraggableId = null;
    let layeredTargetId = null;

    if (depth === 1) {
        baseTargetId = chain[baseDraggableId];
    } else if (depth === 3) {
        layeredDraggableId = baseDraggableId;
        layeredTargetId = Object.keys(chain[layeredDraggableId])[0];
        baseDraggableId = Object.keys(chain[layeredDraggableId][layeredTargetId])[0];
        baseTargetId = chain[layeredDraggableId][layeredTargetId][baseDraggableId];
    }

    // Nested function chain to handle asynchronous creation and placement.
    function checklayeredDraggable() {
        let layeredDraggable = getById(state, 'draggables', layeredDraggableId, null, false, layeredTargetId, baseDraggableId, baseTargetId);
        if (!layeredDraggable) {
            layeredDraggable = getById(state, 'draggables', layeredDraggableId);
            let layeredTarget = null;
            const baseDraggable = getById(state, 'draggables', baseDraggableId, null, false, baseTargetId);
            baseDraggable.targetField.every((target) => {
                if (target.id === layeredTargetId) {
                    layeredTarget = target;
                }
                return true;
            });

            if (layeredDraggable && layeredTarget) {
                layeredDraggable.moveDraggableTo('target', layeredTarget, () => {
                    processAnswerTargets(state, answerSortedByDepth, depth, i + 1);
                });
            } else {
                processAnswerTargets(state, answerSortedByDepth, depth, i + 1);
            }
        } else {
            processAnswerTargets(state, answerSortedByDepth, depth, i + 1);
        }
    }

    function checkBaseDraggable() {
        let baseDraggable = getById(state, 'draggables', baseDraggableId, null, false, baseTargetId);
        if (!baseDraggable) {
            createBaseDraggableOnTarget(state, baseDraggableId, baseTargetId, true, () => {
                baseDraggable = getById(state, 'draggables', baseDraggableId, null, false, baseTargetId);
                if (!baseDraggable) {
                    console.log('ERROR: Could not successfully create a base draggable on a base target.');
                } else if (!layeredTargetId || !layeredDraggableId) {
                    processAnswerTargets(state, answerSortedByDepth, depth, i + 1);
                } else {
                    checklayeredDraggable();
                }
            });
        } else if (!layeredTargetId || !layeredDraggableId) {
            processAnswerTargets(state, answerSortedByDepth, depth, i + 1);
        } else {
            checklayeredDraggable();
        }
    }
    checkBaseDraggable();
}

/**
 * Calculates the nesting depth of an answer object.
 * @param {object} tempObj - The object to check.
 * @param {number} depth - The current depth.
 * @returns {number} The final depth.
 */
function findDepth(tempObj, depth) {
    let currentDepth = depth;
    if (typeof tempObj !== 'object' || tempObj === null) {
        return currentDepth;
    }
    currentDepth += 1;
    for (const i in tempObj) {
        if (Object.prototype.hasOwnProperty.call(tempObj, i)) {
            currentDepth = findDepth(tempObj[i], currentDepth);
        }
    }
    return currentDepth;
}

/**
 * Repositions all draggables based on a saved answer from the server.
 * @param {object} state - The shared state object.
 * @param {Array} answer - The answer data.
 */
function repositionDraggables(state, answer) {
    if (answer.length === 0) {
        return;
    }

    if (state.config.individualTargets === false) {
        processAnswerPositions(state, answer);
        return;
    }

    const answerSortedByDepth = {};
    let minDepth = 1000;
    let maxDepth = 0;

    answer.forEach((chain) => {
        const depth = findDepth(chain, 0);
        minDepth = Math.min(minDepth, depth);
        maxDepth = Math.max(maxDepth, depth);

        if (!answerSortedByDepth[depth]) {
            answerSortedByDepth[depth] = [];
        }
        answerSortedByDepth[depth].push(chain);
    });

    if ((minDepth < 1) || (maxDepth > 3)) {
        return; // Only support depths 1 and 3 for now.
    }

    processAnswerTargets(state, answerSortedByDepth, maxDepth, 0);
}


// --- EXPORTED FUNCTIONS ---

/**
 * Updates the hidden input field with the current state of draggables.
 * @param {object} state - The shared state object.
 */
export function update(state) {
    const draggables = [];

    if (state.config.individualTargets === false) {
        for (const draggable of state.draggables) {
            if (draggable.x !== -1) {
                draggables.push({
                    [draggable.id]: [draggable.x, draggable.y]
                });
            }
        }
    } else {
        for (const target of state.targets) {
            for (const draggable of target.draggableList) {
                const tempObj = {};
                if (target.type === 'base') {
                    tempObj[draggable.id] = target.id;
                } else {
                    addTargetRecursively(tempObj, draggable, target);
                }
                draggables.push(tempObj);
            }
        }
    }
    $(`#input_${state.problemId}`).val(JSON.stringify(draggables));
}

/**
 * Checks if the input has a value from the server and repositions draggables if it does.
 * @param {object} state - The shared state object.
 * @returns {boolean} True if an answer was processed, false otherwise.
 */
export function check(state) {
    const inputElVal = $(`#input_${state.problemId}`).val();
    if (inputElVal.length === 0) {
        return false;
    }
    repositionDraggables(state, JSON.parse(inputElVal));
    return true;
}

const updateInput = {
    check,
    update
};

export default updateInput;
