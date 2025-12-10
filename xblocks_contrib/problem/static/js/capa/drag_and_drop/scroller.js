/**
 * ES2024 module for creating a draggable item scroller.
 * @param {object} state - The shared state object for the problem.
 */
function Scroller(state) {
    // A variable to hold the left margin for the sliding animation.
    let showElLeftMargin = 0;

    // --- Create DOM Elements ---

    const $parentEl = $(
        '<div style="width: 665px; height: 102px; margin-left: auto; margin-right: auto;"></div>'
    );

    // Common CSS for the arrow buttons.
    const arrowButtonStyles = `
        width: 38px; height: 100px; border: 1px solid #CCC;
        background-color: #EEE;
        background-image: -webkit-linear-gradient(top, #EEE, #DDD);
        background-image: -moz-linear-gradient(top, #EEE, #DDD);
        background-image: -ms-linear-gradient(top, #EEE, #DDD);
        background-image: -o-linear-gradient(top, #EEE, #DDD);
        background-image: linear-gradient(top, #EEE, #DDD);
        -webkit-box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset;
        box-shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset;
        background-position: center center;
        background-repeat: no-repeat;
    `;

    // Safely get the base URL for images.
    const imageUrlBase = window.baseUrl || '';

    // Left Arrow Button
    const $moveLeftEl = $(`
        <div style="width: 40px; height: 102px; display: inline; float: left;">
            <div style="${arrowButtonStyles} background-image: url('${imageUrlBase}images/arrow-left.png');"></div>
        </div>
    `).appendTo($parentEl);

    // Viewport for the slider
    const $showEl = $(
        '<div style="width: 585px; height: 102px; overflow: hidden; display: inline; float: left;"></div>'
    ).appendTo($parentEl);

    // The actual slider that contains the draggables.
    // It's very wide to ensure all items fit in a single row.
    // eslint-disable-next-line no-param-reassign
    state.sliderEl = $(
        '<div style="width: 20000px; height: 100px; border-top: 1px solid #CCC; border-bottom: 1px solid #CCC;"></div>'
    ).appendTo($showEl);

    // Right Arrow Button
    const $moveRightEl = $(`
        <div style="width: 40px; height: 102px; display: inline; float: left;">
            <div style="${arrowButtonStyles} background-image: url('${imageUrlBase}images/arrow-right.png');"></div>
        </div>
    `).appendTo($parentEl);

    // --- Event Handlers ---

    // Function to update the opacity of the arrows based on scroll position.
    const updateArrowOpacity = () => {
        $moveLeftEl.children('div').css('opacity', '1');
        $moveRightEl.children('div').css('opacity', '1');

        if (showElLeftMargin <= -102 * (state.numDraggablesInSlider - 6)) {
            $moveRightEl.children('div').css('opacity', '.4');
        }
        if (showElLeftMargin >= -102) {
            $moveLeftEl.children('div').css('opacity', '.4');
        }
    };

    // Prevent default browser drag/highlight behavior on elements.
    $moveLeftEl.on('mousemove mousedown', (event) => event.preventDefault());
    $moveRightEl.on('mousemove mousedown', (event) => event.preventDefault());
    state.sliderEl.on('mousedown', (event) => event.preventDefault());

    // Click handler for the left arrow.
    $moveLeftEl.on('mouseup', (event) => {
        event.preventDefault();
        // Stop scrolling if at the beginning.
        if (showElLeftMargin > -102) {
            return;
        }
        showElLeftMargin += 102;
        state.sliderEl.animate({
            'margin-left': `${showElLeftMargin}px`
        }, 100, updateArrowOpacity);
    });

    // Click handler for the right arrow.
    $moveRightEl.on('mouseup', (event) => {
        event.preventDefault();
        // Stop scrolling if at the end.
        if (showElLeftMargin < -102 * (state.numDraggablesInSlider - 6)) {
            return;
        }
        showElLeftMargin -= 102;
        state.sliderEl.animate({
            'margin-left': `${showElLeftMargin}px`
        }, 100, updateArrowOpacity);
    });

    // --- Finalization ---

    $parentEl.appendTo(state.containerEl);

    // Expose the update function on the state object so other modules can call it.
    // eslint-disable-next-line no-param-reassign
    state.updateArrowOpacity = updateArrowOpacity;
}

export default Scroller;
