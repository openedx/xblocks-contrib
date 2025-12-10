import updateInput from './update_input.js';
import Targets from './targets.js';

/**
 * ES2024 module containing the core logic for draggable item actions,
 * such as moving to targets, checking drop locations, and snapping.
 */
const DraggableLogic = {
    /**
     * Moves a draggable item to a specific target or coordinate.
     * @param {string} moveType - The type of move ('target' or 'coordinate').
     * @param {object} target - The target object or a coordinate object {x, y}.
     * @param {function} funcCallback - An optional callback to run after the move.
     */
    moveDraggableTo: function(moveType, target, funcCallback) {
        if (!this.hasLoaded) {
            setTimeout(() => {
                this.moveDraggableTo(moveType, target, funcCallback);
            }, 50);
            return;
        }

        if (this.isReusable && this.isOriginal) {
            this.makeDraggableCopy((draggableCopy) => {
                draggableCopy.moveDraggableTo(moveType, target, funcCallback);
            });
            return;
        }

        let offset = this.state.config.targetOutline ? 1 : 0;

        this.inContainer = false;

        if (this.isOriginal) {
            this.containerEl.hide();
            this.iconEl.detach();
        }

        if (this.iconImgEl) {
            this.iconImgEl.css({
                width: this.iconWidth,
                height: this.iconHeight,
            });
        }

        this.iconEl.css({
            'background-color': this.iconElBGColor,
            'padding-left': this.iconElPadding,
            'padding-right': this.iconElPadding,
            border: this.iconElBorder,
            width: this.iconWidth,
            height: this.iconHeight,
        });

        if (moveType === 'target') {
            this.iconEl.css({
                left: target.offset.left + 0.5 * target.w - this.iconWidth * 0.5 + offset - this.iconElLeftOffset,
                top: target.offset.top + 0.5 * target.h - this.iconHeight * 0.5 + offset,
            });
        } else {
            this.iconEl.css({
                left: target.x - this.iconWidth * 0.5 + offset - this.iconElLeftOffset,
                top: target.y - this.iconHeight * 0.5 + offset,
            });
        }
        this.iconEl.appendTo(this.state.baseImageEl.parent());

        if (this.labelEl) {
            if (this.isOriginal) {
                this.labelEl.detach();
            }
            this.labelEl.css({
                'background-color': this.state.config.labelBgColor,
                'padding-left': 8,
                'padding-right': 8,
                border: '1px solid black',
            });
            if (moveType === 'target') {
                this.labelEl.css({
                    left: target.offset.left + 0.5 * target.w - this.labelWidth * 0.5 + offset - 9, // Account for padding, border.
                    top: target.offset.top + 0.5 * target.h + this.iconHeight * 0.5 + 5 + offset,
                });
            } else {
                this.labelEl.css({
                    left: target.x - this.labelWidth * 0.5 + offset - 9, // Account for padding, border.
                    top: target.y - this.iconHeight * 0.5 + this.iconHeight + 5 + offset,
                });
            }
            this.labelEl.appendTo(this.state.baseImageEl.parent());
        }

        if (moveType === 'target') {
            target.addDraggable(this);
        } else {
            this.x = target.x;
            this.y = target.y;
        }

        this.zIndex = 1000;
        this.correctZIndexes();

        Targets.initializeTargetField(this);

        if (this.isOriginal) {
            this.state.numDraggablesInSlider -= 1;
            this.state.updateArrowOpacity();
        }

        if (typeof funcCallback === 'function') {
            funcCallback();
        }
    },

    /**
     * Checks the landing position of the draggable after the mouse is released.
     */
    checkLandingElement: function() {
        this.mousePressed = false;
        const positionIE = this.iconEl.position();

        if (this.state.config.individualTargets) {
            if (this.checkIfOnTarget(positionIE)) {
                this.correctZIndexes();
                Targets.initializeTargetField(this);
            } else {
                if (this.onTarget) {
                    this.onTarget.removeDraggable(this);
                }
                this.moveBackToSlider();
                if (this.isOriginal) {
                    this.state.numDraggablesInSlider += 1;
                }
            }
        } else {
            const isOutOfBounds =
                positionIE.left < 0 ||
                positionIE.left + this.iconWidth > this.state.baseImageEl.width() ||
                positionIE.top < 0 ||
                positionIE.top + this.iconHeight > this.state.baseImageEl.height();

            if (isOutOfBounds) {
                this.moveBackToSlider();
                this.x = -1;
                this.y = -1;
                if (this.isOriginal) {
                    this.state.numDraggablesInSlider += 1;
                }
            } else {
                this.correctZIndexes();
                this.x = positionIE.left + this.iconWidth * 0.5;
                this.y = positionIE.top + this.iconHeight * 0.5;
                Targets.initializeTargetField(this);
            }
        }

        if (this.isOriginal) {
            this.state.updateArrowOpacity();
        }
        updateInput.update(this.state);
    },

    /**
     * Determines if a draggable has been dropped onto a valid target.
     * @param {object} positionIE - The position object from jQuery's .position().
     * @returns {boolean} - True if the draggable is on a target, false otherwise.
     */
    checkIfOnTarget: function(positionIE) {
        for (const target of this.state.targets) {
            const isOccupied = this.state.config.onePerTarget &&
                target.draggableList.length === 1 &&
                target.draggableList[0].uniqueId !== this.uniqueId;

            if (isOccupied) {
                continue;
            }

            if (target.type === 'on_drag' && target.draggableObj.uniqueId === this.uniqueId) {
                continue;
            }

            const centerX = positionIE.left + this.iconWidth * 0.5;
            const centerY = positionIE.top + this.iconHeight * 0.5;

            const isOutside =
                centerY < target.offset.top ||
                centerY > target.offset.top + target.h ||
                centerX < target.offset.left ||
                centerX > target.offset.left + target.w;

            if (isOutside) {
                continue;
            }

            if (this.onTarget && this.onTarget.uniqueId !== target.uniqueId) {
                this.onTarget.removeDraggable(this);
                target.addDraggable(this);
            } else if (!this.onTarget) {
                target.addDraggable(this);
            }

            this.snapToTarget(target);
            return true; // Target was found.
        }
        return false; // Target was not found.
    },

    /**
     * Toggles the ARIA drop effect attribute on the base image and all targets.
     * @param {boolean} isEnabled - Whether to enable or disable the drop effect.
     */
    toggleTargets: function(isEnabled) {
        const effect = isEnabled ? 'move' : null;
        this.state.baseImageEl.attr('aria-dropeffect', effect);
        this.state.targets.forEach(target => {
            target.targetEl.attr('aria-dropeffect', effect);
        });
    },

    /**
     * Snaps a draggable item to the center of a specified target.
     * @param {object} target - The target to snap to.
     */
    snapToTarget: function(target) {
        const offset = this.state.config.targetOutline ? 1 : 0;

        this.iconEl.css({
            left: target.offset.left + 0.5 * target.w - this.iconWidth * 0.5 + offset - this.iconElLeftOffset,
            top: target.offset.top + 0.5 * target.h - this.iconHeight * 0.5 + offset,
        });

        if (this.labelEl) {
            this.labelEl.css({
                left: target.offset.left + 0.5 * target.w - this.labelWidth * 0.5 + offset - 9, // Account for padding, border.
                top: target.offset.top + 0.5 * target.h + this.iconHeight * 0.5 + 5 + offset,
            });
        }
    },

    /**
     * Adjusts z-indexes to ensure the most recently moved item is on top.
     */
    correctZIndexes: function() {
        let highestZIndex = -10000;

        if (this.state.config.individualTargets) {
            if (this.onTarget.draggableList.length > 0) {
                this.onTarget.draggableList.forEach(draggable => {
                    if (draggable.zIndex > highestZIndex && draggable.zIndex !== 1000) {
                        highestZIndex = draggable.zIndex;
                    }
                });
            } else {
                highestZIndex = 0;
            }
        } else {
            this.state.draggables.forEach(draggable => {
                if (!this.inContainer && draggable.zIndex > highestZIndex && draggable.zIndex !== 1000) {
                    highestZIndex = draggable.zIndex;
                }
            });
        }

        if (highestZIndex === -10000) {
            highestZIndex = 0;
        }

        this.zIndex = highestZIndex + 1;
        this.iconEl.css('z-index', this.zIndex);
        if (this.labelEl) {
            this.labelEl.css('z-index', this.zIndex);
        }
    },

    /**
     * Moves a draggable item back to its original position in the slider.
     */
    moveBackToSlider: function() {
        Targets.destroyTargetField(this);

        if (!this.isOriginal) {
            this.iconEl.remove();
            if (this.labelEl) {
                this.labelEl.remove();
            }

            this.state.draggables.splice(this.stateDraggablesIndex, 1);
            this.state.draggables.forEach(draggable => {
                if (draggable.stateDraggablesIndex > this.stateDraggablesIndex) {
                    draggable.stateDraggablesIndex -= 1;
                }
            });
            return;
        }

        this.containerEl.show();
        this.zIndex = 1;

        this.iconEl.detach();
        if (this.iconImgEl) {
            this.iconImgEl.css({
                width: this.iconWidthSmall,
                height: this.iconHeightSmall,
            });
        }
        this.iconEl.css({
            border: 'none',
            'background-color': 'transparent',
            'padding-left': 0,
            'padding-right': 0,
            'z-index': this.zIndex,
            width: this.iconWidthSmall,
            height: this.iconHeightSmall,
            left: 50 - this.iconWidthSmall * 0.5,
            top: (this.labelEl ? 37.5 : 50.0) - 0.5 * this.iconHeightSmall,
        });
        this.iconEl.appendTo(this.containerEl);

        if (this.labelEl) {
            this.labelEl.detach();
            this.labelEl.css({
                border: 'none',
                'background-color': 'transparent',
                'padding-left': 0,
                'padding-right': 0,
                'z-index': this.zIndex,
                left: 50 - this.labelWidth * 0.5,
                top: 42.5 + 0.5 * this.iconHeightSmall,
            });
            this.labelEl.appendTo(this.containerEl);
        }

        this.inContainer = true;
    },
};

export default DraggableLogic;
