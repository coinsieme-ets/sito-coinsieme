const {test}=require('node:test');const assert=require('node:assert/strict');const {rubricaBadge}=require('./article-rubrica');
test('optional rubric does not label old articles',()=>{for(const x of [undefined,null,'','unknown'])assert.equal(rubricaBadge(x),'');});
test('known rubric renders readable fixed label',()=>{assert.match(rubricaBadge('tecnologie-che-aiutano'),/Rubrica: Tecnologie che aiutano/);assert.equal(rubricaBadge('<script>'),'');});
