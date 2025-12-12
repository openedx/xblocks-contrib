/**
 * Updates the text of the number element to show how many draggables are on a target.
 * This function is intended to be called in the context of a target object (`this`).
 */
function updateNumTextEl() {
    if (this.numTextEl) {
        this.numTextEl.text(this.draggableList.length);
    }
}

/**
 * Removes a draggable from this target's list.
 * This function is intended to be called in the context of a target object (`this`).
 * @param {object} draggable - The draggable object to remove.
 */
function removeDraggable(draggable) {
    this.draggableList.splice(draggable.onTargetIndex, 1);

    // After removing an item, update the onTargetIndex for all subsequent items.
    this.draggableList.forEach(item => {
        if (item.onTargetIndex > draggable.onTargetIndex) {
            item.onTargetIndex -= 1;
        }
    });

    draggable.onTarget = null;
    draggable.onTargetIndex = null;

    if (this.type === 'on_drag') {
        this.draggableObj.numDraggablesOnMe -= 1;
    }

    this.updateNumTextEl();
}

/**
 * Adds a draggable to this target's list.
 * This function is intended to be called in the context of a target object (`this`).
 * @param {object} draggable - The draggable object to add.
 */
function addDraggable(draggable) {
    draggable.onTarget = this;
    draggable.onTargetIndex = this.draggableList.push(draggable) - 1;

    if (this.type === 'on_drag') {
        this.draggableObj.numDraggablesOnMe += 1;
    }

    this.updateNumTextEl();
}

/**
 * Cycles the z-index of draggables on a target, bringing the bottom-most one to the top.
 * This function is intended to be called in the context of a target object (`this`).
 */
function cycleDraggableOrder() {
    if (this.draggableList.length < 2) {
        return;
    }

    let lowestZIndex = Infinity;
    let highestZIndex = -Infinity;

    this.draggableList.forEach(draggable => {
        if (draggable.zIndex < lowestZIndex) {
            lowestZIndex = draggable.zIndex;
        }
        if (draggable.zIndex > highestZIndex) {
            highestZIndex = draggable.zIndex;
        }
    });

    this.draggableList.forEach(draggable => {
        if (draggable.zIndex === lowestZIndex) {
            draggable.zIndex = highestZIndex;
        } else {
            draggable.zIndex -= 1;
        }
        draggable.iconEl.css('z-index', draggable.zIndex);
        if (draggable.labelEl) {
            draggable.labelEl.css('z-index', draggable.zIndex);
        }
    });
}

/**
 * Creates and configures a single target element.
 * @param {object} state - The shared state object.
 * @param {object} obj - The configuration for the target.
 * @param {boolean} fromTargetField - Whether this target is part of a draggable's target field.
 * @param {object} draggableObj - The parent draggable object if fromTargetField is true.
 */
function processTarget(state, obj, fromTargetField = false, draggableObj = null) {
    const borderCss = state.config.targetOutline ? 'border: 1px dashed gray;' : '';
    const $targetEl = $(`
        <div style="display: block; position: absolute; width: ${obj.w}px; height: ${obj.h}px; top: ${obj.y}px; left: ${obj.x}px; ${borderCss}" aria-dropeffect=""></div>
    `);

    if (fromTargetField) {
        $targetEl.appendTo(draggableObj.iconEl);
    } else {
        $targetEl.appendTo(state.baseImageEl.parent());
    }
    $targetEl.on('mousedown', (event) => event.preventDefault());

    let $numTextEl = null;
    if (state.config.onePerTarget === false) {
        $numTextEl = $(`
            <div style="display: block; position: absolute; width: 24px; height: 24px; top: ${obj.y}px; left: ${obj.x + obj.w - 24}px; border: 1px solid black; text-align: center; z-index: 500; background-color: white; font-size: 0.95em; color: #009fe2;">0</div>
        `);
    }

    const targetObj = {
        uniqueId: state.getUniqueId(),
        id: obj.id,
        x: obj.x,
        y: obj.y,
        w: obj.w,
        h: obj.h,
        el: $targetEl,
        offset: $targetEl.position(),
        draggableList: [],
        state: state,
        targetEl: $targetEl,
        numTextEl: $numTextEl,
        updateNumTextEl,
        removeDraggable,
        addDraggable,
        type: 'base',
        draggableObj: null,
    };

    if (fromTargetField) {
        targetObj.offset = draggableObj.iconEl.position();
        targetObj.offset.top += obj.y;
        targetObj.offset.left += obj.x;
        targetObj.type = 'on_drag';
        targetObj.draggableObj = draggableObj;
    }

    if (state.config.onePerTarget === false) {
        $numTextEl.appendTo(state.baseImageEl.parent());
        $numTextEl.on('mousedown', (event) => event.preventDefault());
        $numTextEl.on('mouseup', () => cycleDraggableOrder.call(targetObj));
    }

    targetObj.indexInStateArray = state.targets.push(targetObj) - 1;

    if (fromTargetField) {
        draggableObj.targetField.push(targetObj);
    }
}

// --- EXPORTED FUNCTIONS ---

/**
 * Initializes all the base targets defined in the problem configuration.
 * @param {object} state - The shared state object.
 */
export function initializeBaseTargets(state) {
    state.config.targets.forEach(targetConfig => {
        processTarget(state, targetConfig);
    });
}

/**
 * Initializes or updates the positions of a draggable's specific target fields.
 * @param {object} draggableObj - The draggable object whose targets are being initialized.
 */
export function initializeTargetField(draggableObj) {
    if (draggableObj.targetField.length === 0) {
        // First-time initialization
        draggableObj.originalConfigObj.target_fields.forEach(targetObj => {
            processTarget(draggableObj.state, targetObj, true, draggableObj);
        });
    } else {
        // Update positions if already initialized
        const iconElOffset = draggableObj.iconEl.position();
        draggableObj.targetField.forEach(targetObj => {
            targetObj.offset.top = iconElOffset.top + targetObj.y;
            targetObj.offset.left = iconElOffset.left + targetObj.x;
        });
    }
}

/**
 * Removes a draggable's target field from the DOM and the state.
 * @param {object} draggableObj - The draggable object whose targets are being destroyed.
 */
export function destroyTargetField(draggableObj) {
    if (draggableObj.targetField.length === 0) return;

    const indicesToRemove = draggableObj.targetField.map(target => target.indexInStateArray).sort((a, b) => b - a);

    indicesToRemove.forEach(index => {
        draggableObj.state.targets[index].el.remove();
        draggableObj.state.targets.splice(index, 1);
    });

    // After removing, re-index the remaining targets in the state array.
    draggableObj.state.targets.forEach((target, index) => {
        target.indexInStateArray = index;
    });

    draggableObj.targetField = [];
}

const Targets = {
    initializeBaseTargets,
    initializeTargetField,
    destroyTargetField
};

export default Targets;
