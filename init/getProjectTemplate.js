const { request } = require('../utils');

module.exports = function() {
  return request({
    url: '/project/template',
  });
};
