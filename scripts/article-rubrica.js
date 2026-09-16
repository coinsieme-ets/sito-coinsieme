'use strict';
const labels = Object.freeze({'tecnologie-che-aiutano': 'Tecnologie che aiutano'});
function rubricaBadge(value) {
  return labels[value] ? `<span class="article-rubrica">Rubrica: ${labels[value]}</span>` : '';
}
module.exports = {rubricaBadge};
