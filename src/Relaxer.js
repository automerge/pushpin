'use strict';

class Relaxer {
  constructor(objects, props) {
    this.objects = objects;
    this.props = props;
    this.constraints = [];
  }

  add(codeStr) {
    eval(codeStr)
  }

  gt(fn1, fn2) {
    this.constraints.push(new GreaterThanConstraint(fn1, fn2));
  }

  eq(fn1, fn2) {
    this.constraints.push(new EqualsConstraint(fn1, fn2));
  }

  fn(fn) {
    this.constraints.push(new CodeConstraint(fn));
  }

  getError() {
    return this.constraints.
        map(constraint => Math.abs(constraint.getError())).
        reduce((e1, e2) => e1 + e2, 0);
  }

  derivative(constraint, obj, prop) {
    const origValue = obj[prop];

    const calcDerivative = (x0, x1) => {
      obj[prop] = x0;
      const y0 = constraint.getError();
      obj[prop] = x1;
      const y1 = constraint.getError();
      return (y1 - y0) / (x1 - x0);
    }

    let m = calcDerivative(origValue - this.tinyDelta, origValue + this.tinyDelta);
    if (Math.abs(m) < this.tinyDelta) {
      m = calcDerivative(origValue, origValue + this.tinyDelta);
    }
    if (Math.abs(m) < this.tinyDelta) {
      m = calcDerivative(origValue - this.tinyDelta, origValue);
    }
    if (Math.abs(m) < this.tinyDelta) {
      m = 0;
    }
    return m;
  }

  computeDelta(obj, prop) {
    if (!(prop in obj)) {
      console.log("No such prop in obj",prop,obj);
      return undefined;
    }

    let mbs = 0;
    let mms = 0;
    for (const constraint of this.constraints) {
      const m = this.derivative(constraint, obj, prop);
      const b = constraint.getError() - m * obj[prop];

      mbs += m * b;
      mms += m * m;
    }
    const newValue = -mbs / mms;
    return isFinite(newValue) ? newValue - obj[prop] : undefined;
  }

  relax() {
    const deltas = [];
    for (const obj of this.objects) {
      for (const prop of this.props) {
        const delta = this.computeDelta(obj, prop);
        if (delta !== undefined) {
          deltas.push({obj, prop, delta});
        }
      }
    }
    for (const {obj, prop, delta} of deltas) {
      obj[prop] += delta / deltas.length;
    }
  }

  iterateForUpToMillis(tMillis) {
    const t0 = performance.now();
    let count = 0;
    while (this.getError() > this.epsilon && (performance.now() - t0) < tMillis) {
      count++;
      this.relax();
    }
    const error = this.getError();
    if (error > this.epsilon) {
      this.addSomeNoise();
    }
    return count;
  }

  addSomeNoise() {
    for (const obj of this.objects) {
      for (const prop of this.props) {
        const sign = Math.random() < 0.5 ? -1 : 1;
        obj[prop] += sign * this.tinyDelta;
      }
    }
  }
}

Relaxer.prototype.epsilon = 0.001;
Relaxer.prototype.tinyDelta = 0.000001;

class Constraint {
  getError() {
    throw new Error('subclass responsibility');
  }

  toString() {
    throw new Error('subclass responsibility');
  }
}

// Hack! :)
function thunkToString(thunk) {
  const s = thunk.toString();
  const idx = s.indexOf('=>');
  return s.substring(idx + 2).trim();
}

class EqualsConstraint {
  constructor(fn1, fn2) {
    this.fn1 = fn1;
    this.fn2 = fn2;
  }

  getError() {
    return this.fn1() - this.fn2();
  }

  toString() {
    return thunkToString(this.fn1) + ' == ' + thunkToString(this.fn2);
  }
}

class GreaterThanConstraint {
  constructor(fn1, fn2) {
    this.fn1 = fn1;
    this.fn2 = fn2;
  }

  getError() {
    return Math.max(0, this.fn2() - this.fn1());
  }

  toString() {
    return thunkToString(this.fn1) + ' > ' + thunkToString(this.fn2);
  }
}

class CodeConstraint {
  constructor(fn) {
    this.fn = fn;
  }

  getError() {
    return this.fn();
  }

  toString() {
    return 'eval(code)'
  }
}

exports.Relaxer = Relaxer

