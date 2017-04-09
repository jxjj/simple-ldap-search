/* global describe, it, before, beforeEach, after, afterEach */

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import through from 'through2';
import concat from 'concat-stream';
import ldapjs from 'ldapjs';
import settings from './settings.example.js';
import TestLDAPServer from './ldapServer';
import mockData from './mockData';
import SimpleLDAP from '../src/';

const { expect } = chai;
chai.use(chaiAsPromised);

describe('LDAP', () => {
  let ldap; // the ldap client
  const server = new TestLDAPServer();

  // start the LDAP server for testing
  before((done) => {
    server
      .start()
      .then(done)
      .catch(done);
  });

  after((done) => {
    server
      .stop()
      .then(done)
      .catch(done);
  });

  // create a new connection to test LDAP server
  beforeEach((done) => {
    ldap = new SimpleLDAP(settings);
    done();
  });

  // destroy any existing ldap connection
  afterEach((done) => {
    ldap.destroy();
    done();
  });

  describe('ldap client', () => {
    it('new creates new instance of client', (done) => {
      expect(ldap.client).to.be.instanceOf(ldapjs.Client);
      done();
    });

    it('is destroyable', () => {
      ldap.destroy();
      expect(ldap.client).to.be.null;
    });

    it('is destroyable after pipe', (done) => {
      ldap.get()
        .pipe(through.obj(function (obj, _, cb) {
          // relabel `idNumber` as `id`, `uid` as`username`,
          // and create a fullName property. Ditch the rest.
          this.push({
            id: obj.idNumber,
            username: obj.uid,
            fullName: `${obj.givenName} ${obj.sn}`,
          });
          cb();
        }))
        .pipe(concat((data) => {
          expect(data).to.eql([{
            id: 1234567,
            username: 'artvandelay',
            fullName: 'Art Vandelay',
          }, {
            id: 765432,
            username: 'ebenes',
            fullName: 'Elaine Benes',
          }]);
        }))
        .on('finish', () => {
          ldap.destroy();
          expect(ldap.client).to.be.null;
          done();
        })
        .on('error', (err) => {
          done(err);
        });
    });
  });


  describe('ldap.getPromise()', () => {
    it('gets data from LDAP given a filter', () => {
      const expected = {
        dn: 'uid=artvandelay, dc=users, dc=localhost',
        idNumber: 1234567,
        uid: 'artvandelay',
        givenName: 'Art',
        sn: 'Vandelay',
        telephoneNumber: '555-123-4567',
      };

      const filter = '(uid=artvandelay)';
      const attributes = [
        'idNumber',
        'uid',
        'givenName',
        'sn',
        'telephoneNumber',
      ];

      const data = ldap.get(filter, attributes);
      return expect(data).to.eventually.eql([expected]);
    });

    it('gets all data from LDAP given no filter or attributes', (done) => {
      const expected = mockData;

      ldap.getPromise()
        .then((data) => {
          expect(data.length).to.equal(expected.length);
          done();
        })
        .catch(done);
    });
  });

  describe('ldap.getStream()', () => {
    it('gets data from LDAP given a filter', (done) => {
      const expected = {
        dn: 'uid=artvandelay, dc=users, dc=localhost',
        idNumber: 1234567,
        uid: 'artvandelay',
        givenName: 'Art',
        sn: 'Vandelay',
        telephoneNumber: '555-123-4567',
      };

      const filter = '(uid=artvandelay)';
      const attributes = [
        'idNumber',
        'uid',
        'givenName',
        'sn',
        'telephoneNumber',
      ];

      ldap.getStream(filter, attributes)
        .pipe(concat((data) => {
          expect(data).to.eql([expected]);
          done();
        }));
    });

    it('gets all data from LDAP given no filter or attributes', (done) => {
      const expected = mockData;

      ldap.getStream()
        .pipe(concat((data) => {
          expect(data.length).to.equal(expected.length);
          done();
        }));
    });
  });


  describe('ldap.get()', () => {
    it('should bind to DN automatically upon first query', () => {
      return ldap
        .get()
        .then(() => {
          return expect(ldap.isBoundTo).to.equal('cn=root');
        });
    });

    it('gets data from LDAP given a filter', () => {
      const expected = {
        dn: 'uid=artvandelay, dc=users, dc=localhost',
        idNumber: 1234567,
        uid: 'artvandelay',
        givenName: 'Art',
        sn: 'Vandelay',
        telephoneNumber: '555-123-4567',
      };

      const filter = '(uid=artvandelay)';
      const attributes = [
        'idNumber',
        'uid',
        'givenName',
        'sn',
        'telephoneNumber',
      ];

      const data = ldap.get(filter, attributes);
      return expect(data).to.eventually.eql([expected]);
    });
  });

  it('gets all data from LDAP given no filter or attributes', (done) => {
    const expected = mockData;

    ldap.get()
      .then((data) => {
        expect(data.length).to.equal(expected.length);
      })
      .then(done)
      .catch(done);
  });

  it('gets data as a stream', (done) => {
    ldap.get()
      .pipe(through.obj(function remapProps(obj, _, cb) {
        if (!obj) return cb();
        // relabel `idNumber` as `id`, `uid` as`username`,
        // and create a fullName property. Ditch the rest.
        this.push({
          id: obj.idNumber,
          username: obj.uid,
          fullName: `${obj.givenName} ${obj.sn}`,
        });
        return cb();
      }))
      .pipe(concat((data) => {
        expect(data).to.eql([{
          id: 1234567,
          username: 'artvandelay',
          fullName: 'Art Vandelay',
        }, {
          id: 765432,
          username: 'ebenes',
          fullName: 'Elaine Benes',
        }]);
        done();
      }));
  });
});
