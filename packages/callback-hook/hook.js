// XXX This pattern is under development. Do not add more callsites
// using this package for now. See:
// https://meteor.hackpad.com/Design-proposal-Hooks-YxvgEW06q6f
//
// Encapsulates the pattern of registering callbacks on a hook.
//
// The `each` method of the hook calls its iterator function argument
// with each registered callback.  This allows the hook to
// conditionally decide not to call the callback (if, for example, the
// observed object has been closed or terminated).
//
// By default, callbacks are bound with `Meteor.bindEnvironment`, so they will be
// called with the Meteor environment of the calling code that
// registered the callback. Override by passing { bindEnvironment: false }
// to the constructor.
//
// Registering a callback returns an object with a single `stop`
// method which unregisters the callback.
//
// The code is careful to allow a callback to be safely unregistered
// while the callbacks are being iterated over.
//
// If the hook is configured with the `exceptionHandler` option, the
// handler will be called if a called callback throws an exception.
// By default (if the exception handler doesn't itself throw an
// exception, or if the iterator function doesn't return a falsy value
// to terminate the calling of callbacks), the remaining callbacks
// will still be called.
//
// Alternatively, the `debugPrintExceptions` option can be specified
// as string describing the callback.  On an exception the string and
// the exception will be printed to the console log with
// `Meteor._debug`, and the exception otherwise ignored.
//
// If an exception handler isn't specified, exceptions thrown in the
// callback will propagate up to the iterator function, and will
// terminate calling the remaining callbacks if not caught.

export class Hook {
  constructor(options = {}) {
    this.callbacks = new Set();

    // Whether to wrap callbacks with Meteor.bindEnvironment
    const { bindEnvironment = true, wrapAsync = true } = options;
    this.bindEnvironment = !!bindEnvironment;
    this.wrapAsync = !!wrapAsync;

    if (options.exceptionHandler) {
      this.exceptionHandler = options.exceptionHandler;
    } else if (options.debugPrintExceptions) {
      if (typeof options.debugPrintExceptions !== "string") {
        throw new Error("Hook option debugPrintExceptions should be a string");
      }
      this.exceptionHandler = options.debugPrintExceptions;
    }
  }

  clear() {
    this.callbacks.clear();
  }

  register(callback) {
    const exceptionHandler = this.exceptionHandler || function (exception) {
      // Note: this relies on the undocumented fact that if bindEnvironment's
      // onException throws, and you are invoking the callback either in the
      // browser or from within a Fiber in Node, the exception is propagated.
      throw exception;
    };

    if (this.bindEnvironment) {
      callback = Meteor.bindEnvironment(callback, exceptionHandler);
    } else {
      callback = wrapHookWithErrorHandling(callback, exceptionHandler);
    }

    if (this.wrapAsync) {
      callback = Meteor.wrapFn(callback);
    }

    this.callbacks.add(callback);

    return {
      callback,
      stop: () => {
        this.callbacks.delete(callback);
      }
    };
  }

  /**
   * For each registered callback, call the passed iterator function with the callback.
   *
   * The iterator function can choose whether or not to call the
   * callback.  (For example, it might not call the callback if the
   * observed object has been closed or terminated).
   * The iteration is stopped if the iterator function returns a falsy
   * value or throws an exception.
   *
   * @param iterator
   */
  forEach(iterator) {
    for (const callback of this.callbacks) {
      if (!iterator(callback)) break;
    }
  }

  /**
   * For each registered callback, call the passed iterator function with the callback.
   *
   * it is a counterpart of forEach, but it is async and returns a promise
   * @param iterator
   * @return {Promise<void>}
   * @see forEach
   */
  async forEachAsync(iterator) {
    for (const callback of this.callbacks) {
      if (!await iterator(callback)) break;
    }
  }

  /**
   * @deprecated use forEach
   * @param iterator
   */
  each(iterator) {
    return this.forEach(iterator);
  }
}

// Copied from Meteor.bindEnvironment and removed all the env stuff.
function wrapHookWithErrorHandling(func, onException, _this) {
  const exceptionHandler = normalizeHookExceptionHandler(onException);
  return function executeHookWithErrorHandling(...args) {
    let ret;
    try {
      ret = func.apply(_this, args);
    } catch (e) {
      exceptionHandler(e);
    }
    return ret;
  };
}

function normalizeHookExceptionHandler(exceptionHandler) {
  if (typeof exceptionHandler === 'function') {
    return exceptionHandler;
  }

  // TODO: The message "callback of async function" is not very useful and needs clarification.
  const description = typeof exceptionHandler === 'string'
    ? exceptionHandler
    : "callback of async function";
  
  return function defaultHookExceptionHandler(error) {
    Meteor._debug(`Exception in ${description}`, error);
  }
}