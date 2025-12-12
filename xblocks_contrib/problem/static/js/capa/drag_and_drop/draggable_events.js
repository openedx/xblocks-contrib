/**
 * ES2024 module containing the event handling logic for draggable items.
 * This object's methods are intended to be mixed into a draggable item's context,
 * so they rely on `this` referring to a draggable instance.
 */
const DraggableEvents = {
    /**
     * Attaches mousedown, mouseup, and mousemove event listeners to a given element.
     * @param {string} element - The key of the element on the `this` object to attach events to (e.g., 'iconEl').
     */
    attachMouseEventsTo: function(element) {
        // `this` is expected to be the draggable instance.
        this[element].on('mousedown', (event) => this.mouseDown(event));
        this[element].on('mouseup', (event) => this.mouseUp(event));
        this[element].on('mousemove', (event) => this.mouseMove(event));
    },

    /**
     * Handles the mousedown event to initiate a drag operation.
     * @param {Event} event - The mousedown event object.
     */
    mouseDown: function(event) {
        if (this.mousePressed) {
            return;
        }

        // Prevent default browser drag behavior (e.g., image ghosting, text selection).
        event.preventDefault();
        event.stopPropagation();

        if (this.numDraggablesOnMe > 0) {
            return;
        }

        // Handle dragging an item out of the source container.
        if (this.inContainer) {
            if (this.isReusable && this.isOriginal) {
                // If the item can be reused, create a copy and start dragging the copy.
                this.makeDraggableCopy((draggableCopy) => {
                    draggableCopy.mouseDown(event);
                });
                return;
            }

            if (this.isOriginal) {
                this.containerEl.hide();
                this.iconEl.detach();
            }

            if (this.iconImgEl) {
                this.iconImgEl.css({
                    width: this.iconWidth,
                    height: this.iconHeight
                });
            }

            // Position the icon element at the cursor's location.
            this.iconEl.css({
                'background-color': this.iconElBGColor,
                'padding-left': this.iconElPadding,
                'padding-right': this.iconElPadding,
                border: this.iconElBorder,
                width: this.iconWidth,
                height: this.iconHeight,
                left: event.pageX - this.state.baseImageEl.offset().left - this.iconWidth * 0.5 - this.iconElLeftOffset,
                top: event.pageY - this.state.baseImageEl.offset().top - this.iconHeight * 0.5
            });
            this.iconEl.appendTo(this.state.baseImageEl.parent());

            // Position the label element, if it exists.
            if (this.labelEl) {
                if (this.isOriginal) {
                    this.labelEl.detach();
                }
                this.labelEl.css({
                    'background-color': this.state.config.labelBgColor,
                    'padding-left': 8,
                    'padding-right': 8,
                    border: '1px solid black',
                    left: event.pageX - this.state.baseImageEl.offset().left - this.labelWidth * 0.5 - 9, // Account for padding, border.
                    top: event.pageY - this.state.baseImageEl.offset().top + this.iconHeight * 0.5 + 5
                });
                this.labelEl.appendTo(this.state.baseImageEl.parent());
            }

            this.inContainer = false;
            if (this.isOriginal) {
                this.state.numDraggablesInSlider -= 1;
            }
            // Announce action for screen reader users.
            window.SR.readText(gettext('dragging out of slider'));
        } else {
            window.SR.readText(gettext('dragging'));
        }

        // Increase z-index to ensure the dragged item appears above other elements.
        this.zIndex = 1000;
        this.iconEl.css('z-index', '1000');
        if (this.labelEl) {
            this.labelEl.css('z-index', '1000');
        }
        this.iconEl.attr('aria-grabbed', 'true').focus();
        this.toggleTargets(true);
        this.mousePressed = true;
        this.state.currentMovingDraggable = this;
    },

    /**
     * Handles the mouseup event to finalize a drag operation.
     */
    mouseUp: function() {
        if (this.mousePressed) {
            this.state.currentMovingDraggable = null;
            this.iconEl.attr('aria-grabbed', 'false');

            this.checkLandingElement();
            // Announce drop location for screen reader users.
            if (this.inContainer) {
                window.SR.readText(gettext('dropped in slider'));
            } else {
                window.SR.readText(gettext('dropped on target'));
            }
            this.toggleTargets(false);
        }
    },

    /**
     * Handles the mousemove event to update the position of the dragged item.
     * @param {Event} event - The mousemove event object.
     */
    mouseMove: function(event) {
        if (this.mousePressed) {
            // Stop this event from bubbling up to the document's mousemove handler,
            // which serves as a fallback for rapid mouse movements.
            event.stopPropagation();

            // Update icon position.
            this.iconEl.css({
                left: event.pageX - this.state.baseImageEl.offset().left - this.iconWidth * 0.5 - this.iconElLeftOffset,
                top: event.pageY - this.state.baseImageEl.offset().top - this.iconHeight * 0.5
            });

            // Update label position if it exists.
            if (this.labelEl) {
                this.labelEl.css({
                    left: event.pageX - this.state.baseImageEl.offset().left - this.labelWidth * 0.5 - 9, // Account for padding, border.
                    top: event.pageY - this.state.baseImageEl.offset().top + this.iconHeight * 0.5 + 5
                });
            }
        }
    }
};

export default DraggableEvents;
