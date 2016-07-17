# Simple LDAP Get

[![Travis Build](https://img.shields.io/travis/mcadonline/simple-ldap-get.svg?style=flat)](https://travis-ci.org/mcadonline/simple-ldap-get)
[![NPM Version](https://img.shields.io/npm/v/simple-ldap-get.svg)](https://www.npmjs.com/package/simple-ldap-get)

Get data from a LDAP. Nothing fancy.

## Usage

```js
import SimpleLDAP from 'simple-ldap-get';

const settings = {
  url: 'ldap://0.0.0.0:1389',
  base: 'dc=users,dc=localhost',
  bind: { dn: 'cn=root', password: 'secret' }
}

// create a new client
const ldap = new SimpleLDAP(settings.ldap);

// setup a filter and attributes for your LDAP query
const filter = '(uid=artvandelay)';
const attributes = [
  'idNumber',
  'uid',
  'givenName',
  'sn',
  'telephoneNumber',
];

ldap
  .get(filter, attributes)
  .then(console.log);

// [{
//   dn: 'uid=artvandelay, dc=users, dc=localhost',
//   idNumber: 1234567,
//   uid: 'artvandelay',
//   givenName: 'Art',
//   sn: 'Vandelay',
//   telephoneNumber: '555-123-4567',
// }]

```

## API

### `ldap.get(filter, attributes)`

Parameters
  - `filter`: filters results.
  - `attributes`: a list of attributes to return

Returns:
  - A promise for an array of results.


