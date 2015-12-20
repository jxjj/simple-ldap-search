/* global describe, it, before, beforeEach */

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import settings from './settings.example.js';
import startLDAPServer from './ldap-server';
import SimpleLDAP from '../src/';

const { expect } = chai;
chai.use(chaiAsPromised);


describe('LDAP', () => {
  let ldap; // the ldap client

  // start the LDAP server for testing
  before((done) => {
    startLDAPServer().then(done);
  });

  // create a new connection to test LDAP server
  beforeEach((done) => {
    ldap = new SimpleLDAP(settings.ldap);
    done();
  });

  describe('ldap.get()', () =>{
    it('should bind to DN automatically upon first query', () => {
      return ldap.get()
        .then(() => {
          return expect(ldap._isBound).to.be.true;
        });
    });

    // xit('initializes a connection for raw LDAP queries', () => {
    //   const expected = {
    //     dn: 'uid=artvandelay,dc=users,dc=localhost',
    //     idNumber: 1234567,
    //     uid: 'artvandelay',
    //     givenName: 'Art',
    //     sn: 'Vandelay',
    //     telephoneNumber: '555-123-4567',
    //   };

    //   const filter = `(id-number=1234567)`;
    //   const attributes = [
    //     'idNumber',
    //     'uid',
    //     'givenName',
    //     'sn',
    //     'telephoneNumber',
    //   ];

    //   const data = ldap.get(filter, attributes);
    //   return expect(data).to.eventually.eql([expected]);
    // });
  });
});
