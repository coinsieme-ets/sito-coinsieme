'use strict';
function relatedArticles(item, published) {
 const slugs=new Set(Array.isArray(item.related_articles)?item.related_articles:[]);
 return published.filter(a=>a.visible!==false&&a.slug!==item.slug&&slugs.has(a.slug));
}
module.exports={relatedArticles};
