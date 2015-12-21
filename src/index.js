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
    this._isBoundTo = null;
    Promise.promisifyAll(this._client);
  }

  bindToDN() {
    const { dn, password } = this.settings.bind;

    return new Promise((resolve, reject) => {
      // resolve immediately if we've already bound to this dn
      if (this._isBoundTo === dn) {
        resolve();
      }

      this._client.bindAsync(dn, password)
        .then(() => {
          // successful bind
          this._isBoundTo = dn;
          resolve();
        })
        .catch((err) => {
          console.error('Something wrong with the binding', err);
          reject(err);
        });
    });
  }

  get(filter = '(objectclass=*)', attributes) {
    const self = this;

    const opts = {
      filter,
      scope: 'sub',
      attributes,
    };


    return this.bindToDN()
      .then(() => {
        return self._client.searchAsync(self.settings.base, opts);
      })
      .then((response) => {
        return new Promise((resolve, reject) => {
          const data = [];

          response.on('searchEntry', (entry) => {
            data.push(_cleanEntry(entry.object));
          });

          response.on('error', (err) => {
            reject(err);
          });

          response.on('end', () => {
            resolve(data);
          });
        });
      });
  }
}
