import test from 'ava';
import ldapjs from 'ldapjs';
import promiseMap from 'p-map';
import config from './fixtures/config.example';
import TestLDAPServer from './fixtures/TestLDAPServer';
import SimpleLDAP from '../src';

const server = new TestLDAPServer();

test.before('start LDAP Server', async () => server.start());

test.after('stop LDAP Server', async () => server.stop());

test.beforeEach('new client', (t) => {
  server.slowConnection();
  t.context.ldap = new SimpleLDAP(config);
});

test.afterEach('cleanup', (t) => {
  t.context.ldap.destroy();
});

test('create a new LDAP client', (t) => {
  const { ldap } = t.context;
  t.true(ldap.client instanceof ldapjs.Client);
});

test('ldap.destroy()', (t) => {
  const { ldap } = t.context;
  ldap.destroy();
  t.is(ldap.client, null);
  t.is(ldap.queue.length, 0);
});

test('bindDN(dn, password)', async (t) => {
  const { ldap } = t.context;
  const { dn, password } = config;
  const res = await ldap.bindDN(dn, password);
  t.truthy(res);
  t.truthy(ldap.isBoundTo);
  t.false(ldap.isBinding);
  t.is(ldap.queue.length, 0);
});

test('isBoundTo correctly tracks whether bound or not', async (t) => {
  const { ldap } = t.context;
  const { dn, password } = config;
  t.falsy(ldap.isBoundTo);
  const bindPromise = ldap.bindDN(dn, password);
  t.falsy(ldap.isBoundTo);
  await bindPromise;
  t.truthy(ldap.isBoundTo);
  t.is(ldap.queue.length, 0);
});

test('isBinding correctly tracks if a bind is in progress', async (t) => {
  const { ldap } = t.context;
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
  t.is(ldap.queue.length, 0);
});

test('ldap.bindDN() handles multiple binds without falling over', async (t) => {
  const { ldap } = t.context;
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
  t.is(ldap.queue.length, 0);
});

test('concurrent searches', async (t) => {
  const { ldap } = t.context;
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

  const results = await promiseMap(uids, uid =>
    ldap.search(`uid=${uid}`).then(users => (users.length ? users[0] : null)));

  t.is(results.length, uids.length);
  t.is(results[0].uid, 'artvandelay');
  t.is(results[1].uid, 'ebenes');
  t.is(results[4], null);
  t.is(ldap.queue.length, 0);
});

test('ldap.search() returns array of results', async (t) => {
  const { ldap } = t.context;
  const expected = {
    dn: 'uid=artvandelay, dc=users, dc=localhost',
    idNumber: 1234567,
    uid: 'artvandelay',
    givenName: 'Art',
    sn: 'Vandelay',
    telephoneNumber: '555-123-4567',
  };

  const filter = '(uid=artvandelay)';
  const attributes = ['idNumber', 'uid', 'givenName', 'sn', 'telephoneNumber'];

  const { dn, password } = config;
  try {
    await ldap.bindDN(dn, password);
  } catch (err) {
    console.error(err);
  }

  const data = await ldap.search(filter, attributes);
  t.deepEqual(data, [expected]);
  t.is(ldap.queue.length, 0);
});

test('config lacks dn and password', async (t) => {
  const { url, base } = config;
  const ldap = new SimpleLDAP({ url, base });
  try {
    await ldap.search('uid=artvandelay');
    t.fail();
  } catch (err) {
    t.pass();
  }
});

// See Issue #9:
// "some errors are emitted rather than calling the error callback ...
// to reproduce ... search against a url which doesnt respond"
test('handle errors when bad LDAP url', async (t) => {
  // invalid LDAP url
  const url = 'ldap://0.0.0.0:9999';
  const { base, dn, password } = config;
  const ldap = new SimpleLDAP({
    url,
    base,
    dn,
    password,
  });
  try {
    await ldap.search('uid=artvandelay');
    t.fail();
  } catch (err) {
    t.pass();
  }
});
