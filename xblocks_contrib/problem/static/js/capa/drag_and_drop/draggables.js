import draggableEvents from './draggable_events.js';
import draggableLogic from './draggable_logic.js';

/**
 * Creates a copy of a draggable item, used for reusable draggables.
 * This function is intended to be called in the context of a draggable object (`this`).
 * @param {function} callbackFunc - A callback to execute with the new draggable copy.
 */
function makeDraggableCopy(callbackFunc) {
    const draggableObj = {};
    // Create a shallow copy of the original draggable object.
    for (const property in this) {
        if (Object.prototype.hasOwnProperty.call(this, property)) {
            draggableObj[property] = this[property];
        }
    }

    // Modify properties for the new copy.
    draggableObj.isOriginal = false;
    draggableObj.uniqueId = draggableObj.state.getUniqueId();
    draggableObj.stateDraggablesIndex = null;
    draggableObj.containerEl = null;
    draggableObj.iconEl = null;
    draggableObj.iconImgEl = null;
    draggableObj.labelEl = null;
    draggableObj.targetField = [];

    // Create DOM elements and attach events for the copy.
    if (draggableObj.originalConfigObj.icon) {
        draggableObj.iconEl = $('<div></div>');
        draggableObj.iconImgEl = $('<img />', {
            src: draggableObj.originalConfigObj.icon
        });

        draggableObj.iconImgEl.on('load', () => {
            draggableObj.iconEl.css({
                position: 'absolute',
                width: draggableObj.iconWidthSmall,
                height: draggableObj.iconHeightSmall,
                left: 50 - draggableObj.iconWidthSmall * 0.5,
                top: (draggableObj.originalConfigObj.label ? 5 : 50 - draggableObj.iconHeightSmall * 0.5),
            });
            draggableObj.iconImgEl.css({
                position: 'absolute',
                width: draggableObj.iconWidthSmall,
                height: draggableObj.iconHeightSmall,
                left: 0,
                top: 0,
            }).appendTo(draggableObj.iconEl);

            if (draggableObj.originalConfigObj.label) {
                draggableObj.labelEl = $(
                    `<div style="position: absolute; color: black; font-size: 0.95em;" role="label">
                        ${draggableObj.originalConfigObj.label}
                    </div>`
                );
                draggableObj.labelEl.css({
                    left: 50 - draggableObj.labelWidth * 0.5,
                    top: 5 + draggableObj.iconHeightSmall + 5,
                });
                draggableObj.attachMouseEventsTo('labelEl');
            }

            draggableObj.attachMouseEventsTo('iconEl');
            draggableObj.stateDraggablesIndex = draggableObj.state.draggables.push(draggableObj) - 1;

            setTimeout(() => callbackFunc(draggableObj), 0);
        });
    } else if (draggableObj.originalConfigObj.label) {
        draggableObj.iconEl = $(
            `<div style="position: absolute; color: black; font-size: 0.95em;">
                ${draggableObj.originalConfigObj.label}
            </div>`
        );
        draggableObj.iconEl.css({
            left: 50 - draggableObj.iconWidthSmall * 0.5,
            top: 50 - draggableObj.iconHeightSmall * 0.5,
        });
        draggableObj.attachMouseEventsTo('iconEl');
        draggableObj.stateDraggablesIndex = draggableObj.state.draggables.push(draggableObj) - 1;

        setTimeout(() => callbackFunc(draggableObj), 0);
    }
}

/**
 * Processes a single draggable configuration object and creates a draggable instance.
 * @param {object} state - The shared state object.
 * @param {object} obj - The configuration for a single draggable item.
 */
function processDraggable(state, obj) {
    if (!obj.icon && !obj.label) {
        return; // If no icon and no label, don't create a draggable.
    }

    const draggableObj = {
        uniqueId: state.getUniqueId(),
        originalConfigObj: obj,
        stateDraggablesIndex: null,
        id: obj.id,
        isReusable: obj.can_reuse,
        isOriginal: true,
        x: -1,
        y: -1,
        zIndex: 1,
        containerEl: null,
        iconEl: null,
        iconImgEl: null,
        iconElBGColor: null,
        iconElPadding: null,
        iconElBorder: null,
        iconElLeftOffset: null,
        iconWidth: null,
        iconHeight: null,
        iconWidthSmall: null,
        iconHeightSmall: null,
        labelEl: null,
        labelWidth: null,
        hasLoaded: false,
        inContainer: true,
        mousePressed: false,
        onTarget: null,
        onTargetIndex: null,
        state: state,
        targetField: [],
        numDraggablesOnMe: 0,

        // Mix in methods from imported modules
        ...draggableEvents,
        ...draggableLogic,
        makeDraggableCopy,
    };

    draggableObj.containerEl = $(
        `<div style="width: 100px; height: 100px; display: inline-block; overflow: hidden; border-left: 1px solid #CCC; border-right: 1px solid #CCC; text-align: center; position: relative; cursor: move;" role="listitem"></div>`
    ).appendTo(state.sliderEl);

    if (obj.icon) {
        draggableObj.iconElBGColor = 'transparent';
        draggableObj.iconElPadding = 0;
        draggableObj.iconElBorder = 'none';
        draggableObj.iconElLeftOffset = 0;
        draggableObj.iconEl = $('<div></div>');
        draggableObj.iconImgEl = $('<img />', { src: obj.icon });

        draggableObj.iconImgEl.on('load', function() {
            draggableObj.iconWidth = this.width;
            draggableObj.iconHeight = this.height;

            if (draggableObj.iconWidth >= draggableObj.iconHeight) {
                draggableObj.iconWidthSmall = 60;
                draggableObj.iconHeightSmall = draggableObj.iconWidthSmall * (draggableObj.iconHeight / draggableObj.iconWidth);
            } else {
                draggableObj.iconHeightSmall = 60;
                draggableObj.iconWidthSmall = draggableObj.iconHeightSmall * (draggableObj.iconWidth / draggableObj.iconHeight);
            }

            draggableObj.iconEl.css({
                position: 'absolute',
                width: draggableObj.iconWidthSmall,
                height: draggableObj.iconHeightSmall,
                left: 50 - draggableObj.iconWidthSmall * 0.5,
                top: (obj.label ? 37.5 : 50.0) - 0.5 * draggableObj.iconHeightSmall,
            });
            draggableObj.iconImgEl.css({
                position: 'absolute',
                width: draggableObj.iconWidthSmall,
                height: draggableObj.iconHeightSmall,
                left: 0,
                top: 0,
            }).appendTo(draggableObj.iconEl);
            draggableObj.iconEl.appendTo(draggableObj.containerEl);

            if (obj.label) {
                draggableObj.labelEl = $(
                    `<div style="position: absolute; color: black; font-size: 0.95em; cursor: move;">
                        ${obj.label}
                    </div>`
                ).appendTo(draggableObj.containerEl);

                draggableObj.labelWidth = draggableObj.labelEl.width();
                draggableObj.labelEl.css({
                    left: 50 - draggableObj.labelWidth * 0.5,
                    top: 42.5 + 0.5 * draggableObj.iconHeightSmall,
                });
                draggableObj.attachMouseEventsTo('labelEl');
            }
            draggableObj.hasLoaded = true;
        });
    } else { // No icon, but has a label. Treat label as the icon.
        draggableObj.iconElBGColor = state.config.labelBgColor;
        draggableObj.iconElPadding = 8;
        draggableObj.iconElBorder = '1px solid black';
        draggableObj.iconElLeftOffset = 9;
        draggableObj.iconEl = $(
            `<div style="position: absolute; color: black; font-size: 0.95em; cursor: move;" tabindex="0" aria-grabbed="false" role="listitem">
                ${obj.label}
            </div>`
        ).appendTo(draggableObj.containerEl);

        draggableObj.iconWidth = draggableObj.iconEl.width() + 1;
        draggableObj.iconHeight = draggableObj.iconEl.height();
        draggableObj.iconWidthSmall = draggableObj.iconWidth;
        draggableObj.iconHeightSmall = draggableObj.iconHeight;

        draggableObj.iconEl.css({
            left: 50 - draggableObj.iconWidthSmall * 0.5,
            top: 50 - draggableObj.iconHeightSmall * 0.5,
        });
        draggableObj.hasLoaded = true;
    }

    draggableObj.attachMouseEventsTo('iconEl');
    draggableObj.attachMouseEventsTo('containerEl');

    state.numDraggablesInSlider += 1;
    draggableObj.stateDraggablesIndex = state.draggables.push(draggableObj) - 1;
}

/**
 * Initializes all draggable items based on the configuration.
 * @param {object} state - The shared state object for the problem.
 */
function init(state) {
    state.config.draggables.forEach(draggable => {
        processDraggable(state, draggable);
    });
}

const Draggables = {
    init,
};

export default Draggables;
