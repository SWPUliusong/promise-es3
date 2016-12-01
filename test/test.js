'use strict'

const P = require("../p")
const assert = require("assert")

let deep = assert.deepEqual.bind(assert)

function test1() {
  return new P(function(resolve, reject) {
    setTimeout(resolve, 1000, 100)
  })
}

P.all([test1(), 236, test1()])
.then(function(data) {
  console.log(data)
  deep(data, [100, 236, 100], data + '!= [100, 236, 100]')
  return test1()
})
.then(function(data) {
  console.log(data)
  deep(data, 100, data + '!= 100')
  return P.resolve(200)
})
.then(function(data) {
  console.log(data)
  deep(data, 200, data + '!= 200')
  return P.reject(500)
})
.catch(function(err) {
  console.log(err)
  deep(err, 500, err + '!= 500')
})

console.log(P.author)

function p(n) {
  return new P((resolve, reject) => {
    resolve(n + 123)
    if (typeof n === 'number') {
      reject(n)
    }
  })
}

p(123).then(res => console.log(res)).catch(err => console.log(err))