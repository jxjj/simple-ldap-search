/**
* A simple LDAP query machine
*/

import ldap from 'ldapjs';
import Promise from 'bluebird';
import _ from 'lodash';

function _cleanEntry(entryObj) {
  return _.chain(entryObj)
    .omit('controls')
    .mapValues((value) => {
      // 'TRUE' to true
      if (value === 'TRUE') { return true; }

      // if integer string, convert to number
      if (/^\d+$/.test(value)) { return parseInt(value, 10); }

      // otherwise the regular value
      return value;
    }).value();
}

export default class SimpleLDAPGet {
  constructor({ url, base, bind }) {
    this.settings = { url, base, bind };
    this._client = ldap.createClient({ url });
    this._isBound = false;
    Promise.promisifyAll(this._client);
  }

  bindToDN() {
    const { dn, password } = this.settings.bind;
    return this._client.bindAsync(dn, password);
  }

  get(filter = '(uid=tstudent)', attributes) {
    if (!this._isBound) {
      this
        .bindToDN()
        .then(() => {
          this._isBound = true;
        })
        .catch(console.error);
    }

    if (!filter) {
      throw new Error('Please filter results');
    }

    const opts = {
      filter,
      scope: 'sub',
      attributes,
    };

    return this._client
      .searchAsync(this._base, opts)
      .then((res) => {
        const data = [];

        res.on('searchEntry', (entry) => {
          data.push(_cleanEntry(entry.object));
        });

        return new Promise((resolve, reject) => {
          res.on('error', (err) => {
            reject(err);
          });
          res.on('end', () => {
            resolve(data);
          });
        });
      })
      .catch(console.error);
  }
}
