'use strict';

// Non-standard properties that need custom ordering.
// For example, "size" comes before "width".
module.exports = [
  ['size', 'width'],
  ['min-size', 'width'],
  ['max-size', 'width'],
];
