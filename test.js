Promise.all([
  new Promise(function (resolve, reject) {
    reject(new Error('fuck'))
  })
])
.then(function (res) {
  console.log(res)  
}, function (err) {
  console.log(err)
}).catch(function (err) {
  throw err
})
