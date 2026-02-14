// jscodeshift transform to remove sinsole.log and console.log calls
// Usage: npx jscodeshift -t scripts/remove-logs-transform.js "public/js/**/*.js"

module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  let removedCount = 0;

  // Remove sinsole.log() calls
  root.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      object: { name: 'sinsole' },
      property: { name: 'log' }
    }
  }).forEach(path => {
    // Remove the entire statement (including the expression statement wrapper)
    const parent = path.parent;
    if (parent.node.type === 'ExpressionStatement') {
      j(parent).remove();
      removedCount++;
    }
  });

  // Remove console.log() calls (but not in sinsole-config.js or sinsole-log.js)
  if (!fileInfo.path.includes('sinsole-config') && !fileInfo.path.includes('sinsole-log')) {
    root.find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { name: 'console' },
        property: { name: 'log' }
      }
    }).forEach(path => {
      const parent = path.parent;
      if (parent.node.type === 'ExpressionStatement') {
        j(parent).remove();
        removedCount++;
      }
    });
  }

  if (removedCount > 0) {
    console.log(`  Removed ${removedCount} log calls from ${fileInfo.path}`);
  }

  return root.toSource({ quote: 'single' });
};
