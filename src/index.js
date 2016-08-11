/**
* A simple LDAP query machine
*/

import ldap from 'ldapjs';
import Promise from 'bluebird';
import lodash from 'lodash';
import { Readable } from 'stream';

function cleanEntry(entryObj) {
  return lodash.chain(entryObj)
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
    this.client = ldap.createClient({ url });
    this.isBoundTo = null;
    Promise.promisifyAll(this.client);

    // setup passthrough stream
    this.stream = null;
  }

  bindToDN() {
    const { dn, password } = this.settings.bind;

    return new Promise((resolve, reject) => {
      // resolve immediately if we've already bound to this dn
      if (this.isBoundTo === dn) {
        resolve();
      }

      this.client.bindAsync(dn, password)
        .then(() => {
          // console.log('successful bind');
          this.isBoundTo = dn;
          resolve();
        })
        .catch((err) => {
          // console.log('Something wrong with the binding');
          reject(err);
        });
    });
  }

  get(filter = '(objectclass=*)', attributes) {
    const self = this;
    return {
      // if then() is called, we return a promise with fn
      then(fn) {
        return self.getPromise(filter, attributes).then(fn);
      },
      // if pipe is called we return a stream
      pipe(fn) {
        return self.getStream(filter, attributes).pipe(fn);
      },
    };
  }

  getStream(filter, attributes) {
    const self = this;
    const opts = {
      filter,
      scope: 'sub',
      attributes,
    };
    const stream = new Readable({
      read() {}, // no op
      objectMode: true,
    });

    self.bindToDN()
      .then(() => {
        return self.client.searchAsync(self.settings.base, opts);
      })
      .then((response) => {
        response.on('searchEntry', (entry) => {
          stream.push(cleanEntry(entry.object));
        });

        response.on('error', (err) => {
          console.error(err);
        });

        response.on('end', () => {
          stream.push(null);
        });
      });

    return stream;
  }

  getPromise(filter, attributes) {
    const self = this;

    const opts = {
      filter,
      scope: 'sub',
      attributes,
    };

    return this.bindToDN()
      .then(() => {
        return self.client.searchAsync(self.settings.base, opts);
      })
      .then((response) => {
        return new Promise((resolve, reject) => {
          const data = [];

          response.on('searchEntry', (entry) => {
            data.push(cleanEntry(entry.object));
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
