/**
 * Copyright (c) 2019 Guilherme T Maeoka
 * This code is licensed under MIT license.
 * <https://github.com/guimspace/gas-common>
 */

const CacheService2 = {
  document: null,
  user: null,

  getScope: function (scope) {
    if (this[scope]) return;
    switch (scope) {
      case 'document':
        this.document = CacheService.getDocumentCache();
        break;
      case 'user':
        this.user = CacheService.getUserCache();
        break;
      default:
        throw new Error('Invalid scope.');
    }
  },

  get: function (scope, key, type) {
    this.getScope(scope);
    const value = this[scope].get(key);
    if (value == null) return value;
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        return JSON.parse(value);
      case 'string':
        return value;
      default:
        throw new Error('Invalid type.');
    }
  },

  put: function (scope, key, type, value, expiration) {
    this.getScope(scope);
    if (!expiration) expiration = 600;
    switch (type) {
      case 'number':
        value = value.toString();
        break;
      case 'boolean':
        value = value ? 'true' : 'false';
        break;
      case 'json':
        value = JSON.stringify(value);
        break;
      case 'string':
        break;
      default:
        throw new Error('Invalid type.');
    }
    this[scope].put(key, value, expiration);
  },

  putAll: function (scope, pairs, expiration) {
    this.getScope(scope);
    if (!expiration) expiration = 600;
    for (const key in pairs) {
      switch (pairs[key].type) {
        case 'number':
          pairs[key] = pairs[key].value.toString();
          break;
        case 'boolean':
          pairs[key] = pairs[key].value ? 'true' : 'false';
          break;
        case 'json':
          pairs[key] = JSON.stringify(pairs[key].value);
          break;
        case 'string':
          pairs[key] = pairs[key].value;
          break;
        default:
          throw new Error('Invalid type.');
      }
    }
    this[scope].putAll(pairs, expiration);
  },

  remove: function (scope, key) {
    this.getScope(scope);
    this[scope].remove(key);
  },

  removeAll: function (scope, keys) {
    this.getScope(scope);
    this[scope].removeAll(keys);
  }
};
