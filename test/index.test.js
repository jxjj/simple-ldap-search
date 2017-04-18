import test from 'ava';
import ldapjs from 'ldapjs';
import Promise from 'bluebird';
import config from './fixtures/config.example';
import TestLDAPServer from './fixtures/TestLDAPServer';
import SimpleLDAP from '../src';

const server = new TestLDAPServer();
let ldap;

test.before('start LDAP Server', async () => server.start());

test.after('stop LDAP Server', async () => server.stop());

test.beforeEach('new client', () => {
  server.normalConnection();
  ldap = new SimpleLDAP(config);
});

test.afterEach('cleanup', () => {
  ldap.destroy();
});

test('create a new LDAP client', t => (
  t.true(ldap.client instanceof ldapjs.Client)
));

test('ldap.destroy()', (t) => {
  ldap.destroy();
  t.is(ldap.client, null);
});

test('bindDN(dn, password)', async (t) => {
  const { dn, password } = config;
  const res = await ldap.bindDN(dn, password);
  t.truthy(res);
  t.truthy(ldap.isBoundTo);
  t.false(ldap.isBinding);
});

test('isBoundTo correctly tracks whether bound or not', async (t) => {
  const { dn, password } = config;
  t.falsy(ldap.isBoundTo);
  const bindPromise = ldap.bindDN(dn, password);
  t.falsy(ldap.isBoundTo);
  await bindPromise;
  t.truthy(ldap.isBoundTo);
});

test('isBinding correctly tracks if a bind is in progress', async (t) => {
  const { dn, password } = config;

  // begins as false
  t.false(ldap.isBinding);
  const bindPromise = ldap.bindDN(dn, password);

  // once the bind process begins, isBinding should be true
  t.true(ldap.isBinding);
  await bindPromise;
  t.truthy(ldap.isBoundTo);

  // back to false
  t.false(ldap.isBinding);
});

test('ldap.bindDN() handles multiple binds without falling over', async (t) => {
  ldap.bindDN();
  t.notThrows(ldap.bindDN());
  t.notThrows(ldap.bindDN());

  try {
    await ldap.bindDN();
  } catch (err) {
    console.error(err);
  }

  const users = await ldap.search('uid=artvandelay', ['idNumber']);
  t.is(users.length, 1);
  t.is(users[0].idNumber, 1234567);
});

test('concurrent searches', async (t) => {
  const uids = [
    'artvandelay',
    'ebenes',
    'artvandelay',
    'ebenes',
    'invaliduser',
    'artvandelay',
    'ebenes',
    'artvandelay',
    'ebenes',
    'invaliduser',
    'artvandelay',
    'ebenes',
    'artvandelay',
    'ebenes',
    'invaliduser',
  ];

  await ldap.bindDN();

  const results = await Promise.map(uids, uid => (
    ldap.search(`uid=${uid}`)
      .then(users => (users.length ? users[0] : null))
  ));

  t.is(results.length, uids.length);
  t.is(results[0].uid, 'artvandelay');
  t.is(results[1].uid, 'ebenes');
  t.is(results[4], null);
});

test('ldap.search() returns array of results', async (t) => {
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

  const { dn, password } = config;
  try {
    await ldap.bindDN(dn, password);
  } catch (err) {
    console.error(err);
  }

  const data = await ldap.search(filter, attributes);
  t.deepEqual(data, [expected]);
});
