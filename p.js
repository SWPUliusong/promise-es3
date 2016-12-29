;(function(root){
  'use strict'
  // 兼容不支持bind方法的环境
  Function.prototype.bind = Function.prototype.bind || function(cxt) {
    let fn = this;
    let arg1 = [].slice.call(arguments, 1);
    return function () {
      let arg2 = [].slice.call(arguments);
      return fn.apply(cxt, arg1.concat(arg2));
    }
  }

  // 自实现数组forEach方法
  Array.prototype.forEach = function(cb) {
      var len = this.length;
      for (var i = 0; i < len; i++) {
          cb(this[i], i, this)
      }
  }

  // 自实现数组some方法
  Array.prototype.some = function(cb) {
      var len = this.length;
      for (var i = 0; i < len; i++) {
          if (cb(this[i], i, this)) {
              return true;
          }
      }
      return false;
  }

  function P(fn) {
    if (typeof fn !== 'function') {
      throw new Error('the arguments is not a function');
    }
    this.status = 'pending'; // 状态
    this.queue = []; // 任务队列
    this.isPromise = true;
    this.errorHandler = null;
    // 延时等待任务队列注册
    var self = this;
    setTimeout(function() {
      fn.call(self, self.resolve.bind(self), self.reject.bind(self));
    }, 0)
  }
  P.author = 'liusong';
  P.version = '0.0.1';

  // 直接转交成功数据
  P.resolve = function(data) {
    return new P(function(res, rej) {
      res(data);
    })
  }

  // 直接转交失败原因
  P.reject = function(data) {
    return new P(function(res, rej) {
      rej(data);
    })
  }

  // 批处理
  P.all = function(arr) {
    // 如果全部都不是Promise,则直接当成数据转交给handler
    var flag = arr.some(function(p){
      return p.isPromise;
    })

    if (!flag) {
      return P.resolve(arr);
    }

    return new P(function(resolve, reject) {
      if (!(arr instanceof Array)) {
        return reject('P.all need a Array');
      }

      var res = [],   // 存储结果
        pending = 0;  // 记录异步任务完成状态

      arr.forEach(function(p, i) {
        if (p.isPromise) {
          pending++;   // 注册异步任务
          p.then(function(data) {
            pending--;   // 异步任务完成
            res[i] = data;
            if (pending === 0) {  // 为0时，全部完成
              resolve(res);
            }
          })
        } else {
          // 不是Promise则直接当成数据
          res[i] = p;
        }
      })
    })
  }

  // 成功态
  P.prototype.resolve = function(data) {
    if (this.status === 'pending') {
      this.status = 'resolve'
      // 只触发接下来第一个控制器
      var handler = this.queue.shift();
      if (handler && handler.success) {
        var next = handler.success(data);
        if (next && next.isPromise) {
          //任务队列转交
          next.queue = this.queue;
          next.errorHandler = this.errorHandler;
        }
      }
    }
    return;
  }

  // 失败态
  P.prototype.reject = function(error) {
    if (this.status === 'pending') {
      this.status = 'reject';
      //如果catch监听则放弃执行then方法的第二个参数
      if (this.errorHandler) {
        this.errorHandler(error);
        return;
      }

      //只触发接下来第一个控制器
      var handler = this.queue.shift();
      if (handler && handler.error) {
        var next = handler.error(data);
        if (next && next.isPromise) {
          next.queue = this.queue;
          return;
        }
      }
    }
  }

  P.prototype.then = function(resolve, reject) {
    if (typeof resolve !== 'function') {
      throw new Error('the resolve is not a function');
    }
    var handler = {};

    handler.success = resolve;

    if (typeof reject === 'function') {
      handler.error = reject;
    }

    this.queue.push(handler);

    return this;
  }

  P.prototype.catch = function(reject) {
    if (typeof reject !== 'function') {
      throw new Error('the reject is not a function');
    }
    this.errorHandler = reject;
    return;
  }

  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = P;
  }
  else {
    root.P = P;
  }
})(this);
