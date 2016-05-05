module.exports = function(name,deps) {
  var i,len,missing=[];
  for (i = 0, len = deps.length; i < len; i++) {
    try {
      require.resolve(deps[i])
    } catch {
      missing.push(deps[i])
    }
  }
  if (missing.length > 0) {
    var message = 'You are trying to use "'+name+'". '
    var npmInstall = 'npm install --save-dev '+missing.join(" ")
    if (missing.length > 1) {
      var last = missing.pop()
      message += missing.join(', ') + ' and ' +last + ' are '
    } else {
      message += missing[0] + ' is '
    }
    message += 'missing.\n\nTo install run:\n'+npmInstall
    throw new Error(message)
  }
}
