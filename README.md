# Simple LDAP Search

[![NPM Version](https://img.shields.io/npm/v/simple-ldap-search.svg)](https://www.npmjs.com/package/simple-ldap-search)

> Searches LDAP. Nothing fancy.

A thin, promisified wrapper over [LDAPjs](http://ldapjs.org)'s client.

## Installation

```sh
$ npm install --save simple-ldap-search
```

## Usage

```js
import SimpleLDAP from 'simple-ldap-search';

const config = {
  url: 'ldap://0.0.0.0:1389',
  base: 'dc=users,dc=localhost',
  dn: 'cn=root',
  password: 'secret',
};

// create a new client
const ldap = new SimpleLDAP(config);

// setup a filter and attributes for your LDAP query
const filter = '(uid=artvandelay)';
const attributes = ['idNumber', 'uid', 'givenName', 'sn', 'telephoneNumber'];

// using async/await
const users = await ldap.search(filter, attributes);

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

### `ldap.search(filter, attributes)`

Parameters

- `filter`: filters results.
- `attributes`: a list of attributes to return

Returns

- A promise for the results

### `ldap.destroy()`

Destroys the connection to the LDAP server. Use when all done with LDAP client.
