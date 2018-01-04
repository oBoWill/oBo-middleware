'use strict';
const pm2 = require('pm2');
const chalk = require('chalk');
const columnify = require('columnify');
const readline = require('readline');
const { Duplex, Readable, Transform, Writable } = require('stream');
const { WriteStream } = require('tty');

const formatWrite = require('./format');

const getIn = (obj, keyPath) => {
  if(typeof obj !== 'object' || obj === null || !keyPath)
    return obj;
  if(typeof keyPath === 'string')
    keyPath = keyPath.split('.');
  if(typeof obj.getIn === 'function')
    return obj.getIn(keyPath);
  return keyPath.reduce((curr, key, i) => {
    if(typeof curr.get === 'function')
      return curr.get(key);
    return curr[key];
  }, obj);
};

class Log {

  constructor(props = {
    input: process.stdin,
    output: process.stdout,
    error: process.stderr,
  }) {

    if(!(this instanceof Log))
      return new Log(props);

    let {
      input,
      output,
      error,
    } = props;

    if(!input)
      input = process.stdin;
    if(!output)
      output = process.stdout;
    if(!error)
      error = process.stderr;

    this.input = input;
    this.output = output;
    this.error = error;

    this.rl = readline.createInterface({ terminal: true, input, output });
    this.rl.close();

    this.listeners = {};
    this.components = {};
    this.registry = [];

    this._messageQueue = [];
    this._timeoutId = null;

    let pipeLog = (data) => {
      this._messageQueue.push(data.toString());
    };

    // Capture output stream to prevent unexpected writes.
    // this.stdinWrite = this._captureStream(output, pipeLog);
    this.stdoutWrite = this._captureStream(output, pipeLog);
    this.stderrWrite = this._captureStream(error, pipeLog);

    // this.output.on('data', () => {
    //   setTimeout(() => this.error.write('woah'), 1000);
    // });

    process.on('exit', () => {
      clearTimeout(this._timeoutId);
      this.release();
    });

    return this;

  }

  _captureStream(_stream, fn = () => null) {

    const oldWrite = _stream.write;

    let write;

    _stream.write = fn;

    write = oldWrite.bind(_stream);
    write.release = () => {
      _stream.write = write;
    };
    write.capture = () => {
      _stream.write = fn;
    };

    return write;

  }

  _calculateHeight(data) {
    let { columns } = this.output;
    // data = /\n$/.test(data) ? data.trim() + '\n' : data + '\n';
    return data.split('\n').reduce((height, line, i) => {
      let overflow = Math.floor(chalk.stripColor(line).length / (columns + 1));
      return height + 1 + overflow;
    }, 0);
  }

  _updateRegistry(index, data) {

    this.registry[index].cache = {
      data: this.registry[index].data,
      height: this.registry[index].height,
    };

    this.registry[index].data = data.trim() + '\n';
    this.registry[index].height = this._calculateHeight(data.trim());

  }

  _updateComponentIndex() {
    this.registry.forEach((registryItem, index) => {
      let item = getIn(this.components, registryItem.keyPath);
      item.index = index;
    });
  }

  _throttle() {

    if(this._timeoutId !== null) return;

    this._timeoutId = setTimeout(() => {
      this.render();
      this._timeoutId = null;
    }, 512);

  }

  _out(data, cfg = {}) {

    // if(cfg.hasOwnProperty('clear') && cfg.clear) {
    //   let height = typeof cfg.clear === 'number'
    //     ? cfg.clear
    //     : this._calculateHeight(data.trim());
    //   this._clear(height);
    // }

    this.stdoutWrite(data.toString());
  }

  _err(data, cfg = {}) {
    this.stderrWrite(data);
  }

  _clear(lines) {

    if(!lines) return;

    let count = Math.abs(lines);
    let direction = lines >= 0 ? 1 : -1;

    this.release();

    for(let i = 0; i < count; i++) {
      readline.clearLine(this.output, 0);
      readline.moveCursor(this.output, 0, direction);
    }

    readline.moveCursor(this.output, 0, 0 - lines);

    this.capture();

  }

  release() {
    // this.stdinWrite.release();
    this.stdoutWrite.release();
    this.stderrWrite.release();
  }

  capture() {
    // this.stdinWrite.release();
    this.stdoutWrite.capture();
    this.stderrWrite.capture();
  }

  log(data) {

    if(!this.components.hasOwnProperty('io')) {

      this.components.io = { log: { index: 0 } };
      this.registry.unshift({ keyPath: ['io', 'log'] });

      let title = formatWrite.title.io({ columns: this.output.columns });

      this._updateComponentIndex();
      this._updateRegistry(0, title);

    }

    this._messageQueue.push(data);

    this._throttle();

  }

  err(data) {
    this._err(data);
  }

  render({ index, message } = {}) {

    index = index || 0;

    let registryItem = this.registry[index];

    if(!registryItem)
      return;

    let { cache, data, height } = registryItem;

    let queue;
    let dy = 0;

    if(registryItem.mounted) dy += height;
    else registryItem.mounted = true;

    queue = [registryItem.data];

    for(let i = index + 1; i < this.registry.length; i++) {

      let nextItem = this.registry[i] || { height: 0 };

      if(nextItem.mounted) dy += nextItem.height;
      else nextItem.mounted = true;

      queue && queue.push(nextItem.data);

    }

    this.release();
    readline.moveCursor(this.output, 0, -dy);
    readline.clearScreenDown(this.output);
    this.capture();

    if(this._messageQueue.length)
      queue = this._messageQueue.concat(queue), this._messageQueue = [];

    if(message)
      queue.unshift(message.trim() + '\n');

    queue && queue.forEach((d) => {
      return this._out(d);
    });

  }

  setStatus(name, { format, type, percentage, message, data } = {}) {

    if(!type)
      type = 'process';
    if(!name)
      name = `p_${this.registry.length}`;

    let index;
    let status = data || { percentage, message };


    if(!this.components.hasOwnProperty(type)) {

      this.components[type] = {};
      this.components[type].index = this.registry.length;

      if(formatWrite.title.hasOwnProperty(type)) {
        this.registry.push({ keyPath: [type] });
        let typeTitle = formatWrite.title[type]({
          columns: this.output.columns,
          rows: this.output.rows
        });
        this._updateRegistry(this.components[type].index, typeTitle);
      }

    }

    if(!this.components[type].hasOwnProperty(name)) {
      index = this.registry.length;
      this.components[type][name] = { index };
      this.registry.push({ keyPath: [type, name] });
    }

    let item = this.components[type][name];
    item.status = status;

    if(typeof index === 'undefined')
      index = item.index;

    let writeData;
    let props = Object.assign({ item }, {
      name,
      type,
      columns: this.rl.output.columns,
      rows: this.rl.output.rows,
    });

    if(typeof format === 'function')
      writeData = format(props);
    else if(formatWrite.status.hasOwnProperty(type))
      writeData = formatWrite.status[type](props);

    this._updateRegistry(index, writeData);

    this._throttle();

  }

  // createStream(name = 'stream', { type, event, stream } = {}) {
  //
  //   if(!type)
  //     type = 'stream';
  //   if(!event)
  //     event = 'data';
  //
  //   if(!this.listeners.hasOwnProperty(name))
  //     this.listeners[name] = {};
  //
  //   if(this.listeners[name].hasOwnProperty(type)) {
  //     console.error(`process ${name} already has listener ${event}`);
  //     return;
  //   }
  //
  //   stream = stream ?
  //     stream
  //     :
  //     new Duplex({
  //       write(chunk, encoding, callback) {
  //         // this.emit('data', chunk, encoding, cb);
  //         // callback();
  //       },
  //     });
  //
  //   return stream;
  //
  // }
  //
  // registerEvent(name, { event, format, type, stream }) {
  //   stream.on(event, (...args) => {
  //     // log in stream panel
  //   })
  // }
  //
  // createEvent
  //
  // registerPanel({ name, event, format, stream, update }) {
  //
  // }

}

module.exports = Log;
