'use strict';

// Non-standard properties that need custom ordering.
// For example, "size" comes before "width".
module.exports = [
  ['size', 'width'],
  ['min-size', 'width'],
  ['max-size', 'width'],
  ['user-select', 'cursor'],
  ['border-top-radius', 'border-top-left-radius'],
  ['border-bottom-radius', 'border-bottom-left-radius'],
];
