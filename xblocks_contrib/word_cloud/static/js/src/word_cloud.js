/* Javascript for WordCloudXBlock. */

const blockIdentifier = '.word_cloud_block';
// Dimensions of the box where the word cloud will be drawn.
const width = 635;
const height = 635;


/* Dummy code to make sure events work in Workbench as well as
 * edx-platform*/
if (typeof Logger === 'undefined') {
  var Logger = {
    log: function (a, b) {
      return;
    }
  };
}

/**
 * Generates a unique ID for word cloud elements.
 * @param {string} wordCloudId - ID of the word cloud block.
 * @param {number} counter - Counter for uniqueness.
 * @returns {string} - Unique identifier.
 */
function generateUniqueId(wordCloudId, counter) {
  return `_wc_${wordCloudId}_${counter}`;
}

function WordCloudBlock(runtime, element) {

  // eslint-disable-next-line no-undef
  const wordCloudEl = $(element).find(blockIdentifier);

  // Get the URL to which we will post the users words.
  const ajax_url = wordCloudEl.data('ajax-url');

  // Hide WordCloud container until Ajax request is complete.
  wordCloudEl.hide();

  // Fetch initial state via AJAX request. Attach a callback that will
  // be fired on server's response.
  // eslint-disable-next-line no-undef
  $.postWithPrefix(
    `${ajax_url}/get_state`,
    null,
    (response) => {
      if (response.status !== 'success') {
        console.error('Failed to fetch state');
        return;
      }

      configJson = response;
      if (configJson && configJson.submitted) {
        showWordCloud(configJson, wordCloudEl);
      }

    },
  )
    .done(() => {
      // Show WordCloud container after Ajax request done
      wordCloudEl.show();
    });

  // eslint-disable-next-line no-undef
  $(element).find('.save').on('click', () => {
    submitAnswer(ajax_url, wordCloudEl);
  });
}

/**
 * @function submitAnswer
 *
 * Callback to be executed when the user eneter his words. It will send user entries to the
 * server, and upon receiving correct response, will call the function to generate the
 * word cloud.
 */
function submitAnswer(ajax_url, wordCloudEl)
{
  const data = {student_words: []};

  // Populate the data to be sent to the server with user's words.
  wordCloudEl.find('input.input-cloud').each((index, value) => {
    // eslint-disable-next-line no-undef
    data.student_words.push($(value).val());
  });

  // Send the data to the server as an AJAX request. Attach a callback that will
  // be fired on server's response.
  // eslint-disable-next-line no-undef
  $.postWithPrefix(
    `${ajax_url}/submit`,
    // eslint-disable-next-line no-undef
    $.param(data),
    (response) => {
      if (response.status !== 'success') {
        console.error('Submission failed');
        return;
      }

      showWordCloud(response, wordCloudEl);
    },
  );
}

/**
 * @function showWordCloud
 *
 * @param {object} response The response from the server that contains the user's entered words
 * along with all of the top words.
 *
 * This function will set up everything for d3 and launch the draw method. Among other things,
 * iw will determine maximum word size.
 */
function showWordCloud(response, wordCloudEl)
{
  const words = response.top_words;
  let maxSize = 0;
  let minSize = 10000;
  let scaleFactor = 1;
  let maxFontSize = 200;
  const minFontSize = 16;

  wordCloudEl.find('.input_cloud_section').hide();

  // Find the word with the maximum percentage. I.e. the most popular word.
  // eslint-disable-next-line no-undef
  $.each(words, (index, word) => {
    if (word.size > maxSize) {
      maxSize = word.size;
    }
    if (word.size < minSize) {
      minSize = word.size;
    }
  });

  // Find the longest word, and calculate the scale appropriately. This is
  // required so that even long words fit into the drawing area.
  //
  // This is a fix for: if the word is very long and/or big, it is discarded by
  // for unknown reason.
  // eslint-disable-next-line no-undef
  $.each(words, (index, word) => {
    let tempScaleFactor = 1.0;
    const size = ((word.size / maxSize) * maxFontSize);

    if (size * 0.7 * word.text.length > width) {
      tempScaleFactor = ((width / word.text.length) / 0.7) / size;
    }

    if (scaleFactor > tempScaleFactor) {
      scaleFactor = tempScaleFactor;
    }
  });

  // Update the maximum font size based on the longest word.
  maxFontSize *= scaleFactor;

  // Generate the word cloud.
  d3.layout.cloud().size([width, height])
    .words(words)
    .rotate(() => Math.floor((Math.random() * 2)) * 90)
    .font('Impact')
    .fontSize((d) => {
      let size = (d.size / maxSize) * maxFontSize;

      size = size >= minFontSize ? size : minFontSize;

      return size;
    })
    // Draw the word cloud.
    .on('end', (wds, bounds) => drawWordCloud(response, wds, bounds, wordCloudEl))
    .start();
}

/**
 * @function drawWordCloud
 *
 * This function will be called when d3 has finished initing the state for our word cloud,
 * and it is ready to hand off the process to the drawing routine. Basically set up everything
 * necessary for the actual drwing of the words.
 *
 * @param {object} response The response from the server that contains the user's entered words
 * along with all of the top words.
 *
 * @param {array} words An array of objects. Each object must have two properties. One property
 * is 'text' (the actual word), and the other property is 'size' which represents the number that the
 * word was enetered by the students.
 *
 * @param {array} bounds An array of two objects. First object is the top-left coordinates of the bounding
 * box where all of the words fir, second object is the bottom-right coordinates of the bounding box. Each
 * coordinate object contains two properties: 'x', and 'y'.
 */
function drawWordCloud(response, words, bounds, wordCloudEl)
{
  // Color words in different colors.
  const fill = d3.scale.category20();

  // Will be populated by words the user enetered.
  const studentWordsKeys = [];

  // By default we do not scale.
  let scale = 1;

  // Caсhing of DOM element
  const cloudSectionEl = wordCloudEl.find('.result_cloud_section');

  // Iterator for word cloud count for uniqueness
  let wcCount = 0;

  // If bounding rectangle is given, scale based on the bounding box of all the words.
  if (bounds) {
    scale = 0.5 * Math.min(
      width / Math.abs(bounds[1].x - (width / 2)),
      width / Math.abs(bounds[0].x - (width / 2)),
      height / Math.abs(bounds[1].y - (height / 2)),
      height / Math.abs(bounds[0].y - (height / 2)),
    );
  }

  // eslint-disable-next-line no-undef
  $.each(response.student_words, (word, stat) => {
    const percent = (response.display_student_percents) ? ` ${Math.round(100 * (stat / response.total_count))}%` : '';

    studentWordsKeys.push(interpolateHtml(
      '{listStart}{startTag}{word}{endTag}{percent}{listEnd}',
      {
        listStart: HTML('<li>'),
        startTag: HTML('<strong>'),
        word,
        endTag: HTML('</strong>'),
        percent,
        listEnd: HTML('</li>'),
      },
    ).toString());
  });

  // Comma separated string of user enetered words.
  const studentWordsStr = studentWordsKeys.join('');

  cloudSectionEl.addClass('active');

  setHtml(
    cloudSectionEl.find('.your_words'),
    HTML(studentWordsStr),
  );

  setHtml(
    cloudSectionEl.find('.your_words').end().find('.total_num_words'),
    interpolateHtml(
      gettext('{start_strong}{total}{end_strong} words submitted in total.'),
      {
        start_strong: HTML('<strong>'),
        end_strong: HTML('</strong>'),
        total: response.total_count,
      },
    ),
  );

  // eslint-disable-next-line no-undef
  $(`${cloudSectionEl.attr('id')} .word_cloud`).empty();

  // Actual drawing of word cloud.
  const groupEl = d3.select(`#${cloudSectionEl.attr('id')} .word_cloud`).append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${0.5 * width},${0.5 * height})`)
    .selectAll('text')
    .data(words)
    .enter()
    .append('g')
    .attr('data-id', () => {
      wcCount += 1;
      return wcCount;
    })
    .attr('aria-describedby', () => interpolateHtml(
      gettext('text_word_{uniqueId} title_word_{uniqueId}'),
      {
        // eslint-disable-next-line no-undef
        uniqueId: generateUniqueId(cloudSectionEl.attr('id'), $(this).data('id')),
      },
    ));

  groupEl
    .append('title')
    .attr('id', () => interpolateHtml(
      gettext('title_word_{uniqueId}'),
      {
        // eslint-disable-next-line no-undef
        uniqueId: generateUniqueId(cloudSectionEl.attr('id'), $(this).parent().data('id')),
      },
    ))
    .text((d) => {
      let res = '';

      // eslint-disable-next-line no-undef
      $.each(response.top_words, (index, value) => {
        if (value.text === d.text) {
          res = `${value.percent}%`;
        }
      });

      return res;
    });

  groupEl
    .append('text')
    .attr('id', () => interpolateHtml(
      gettext('text_word_{uniqueId}'),
      {
        // eslint-disable-next-line no-undef
        uniqueId: generateUniqueId(cloudSectionEl.attr('id'), $(this).parent().data('id')),
      },
    ))
    .style('font-size', d => `${d.size}px`)
    .style('font-family', 'Impact')
    .style('fill', (d, i) => fill(i))
    .attr('text-anchor', 'middle')
    .attr('transform', d => `translate(${d.x}, ${d.y})rotate(${d.rotate})scale(${scale})`)
    .text(d => d.text);
}
