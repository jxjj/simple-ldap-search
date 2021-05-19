import ldapjs from 'ldapjs';
import promiseMap from 'p-map';
import config from './test/fixtures/config.example.js';
import TestLDAPServer from './test/fixtures/TestLDAPServer.js';
import SimpleLDAP from './index.js';

const server = new TestLDAPServer();

describe('simple-ldap-search index', () => {
  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it('creates a new LDAP client', () => {
    const ldap = new SimpleLDAP(config);
    expect(ldap.client instanceof ldapjs.Client).toBe(true);
    ldap.destroy();
  });

  it('creates a new LDAP client with TLS Options', () => {
    const ldap = new SimpleLDAP(config, {rejectUnauthorized: false});
    expect(ldap.client instanceof ldapjs.Client).toBe(true);
    ldap.destroy();
  });

  it('ldap.destroy()', () => {
    const ldap = new SimpleLDAP(config);
    ldap.destroy();
    expect(ldap.client).toBe(null);
    expect(ldap.queue.length).toBe(0);
  });

  describe('bindDN(dn, password)', () => {
    it('binds', async () => {
      const ldap = new SimpleLDAP(config);
      const { dn, password } = config;
      const res = await ldap.bindDN(dn, password);
      expect(res).toBeTruthy();
      expect(ldap.isBoundTo).toBeTruthy();
      expect(ldap.isBinding).toBe(false);
      expect(ldap.queue.length).toBe(0);
      ldap.destroy();
    });
  });

  describe('isBoundTo', () => {
    it('correctly tracks whether bound or not', async () => {
      const ldap = new SimpleLDAP(config);

      const { dn, password } = config;
      expect(ldap.isBoundTo).toBeFalsy();
      const bindPromise = ldap.bindDN(dn, password);
      expect(ldap.isBoundTo).toBeFalsy();
      await bindPromise;
      expect(ldap.isBoundTo).toBeTruthy();
      expect(ldap.queue.length).toBe(0);
      ldap.destroy();
    });
  });

  describe('isBinding', () => {
    it('correctly tracks if a bind is in progress', async () => {
      const ldap = new SimpleLDAP(config);
      const { dn, password } = config;

      // begins as false
      expect(ldap.isBinding).toBeFalsy();
      const bindPromise = ldap.bindDN(dn, password);

      // once the bind process begins, isBinding should be true
      expect(ldap.isBinding).toBeTruthy();
      await bindPromise;
      expect(ldap.isBoundTo).toBeTruthy();

      // back to false
      expect(ldap.isBinding).toBeFalsy();
      expect(ldap.queue.length).toBe(0);

      ldap.destroy();
    });
  });

  describe('ldap.bindDN', () => {
    it('ldap.bindDN() handles multiple binds without falling over', async () => {
      const ldap = new SimpleLDAP(config);

      ldap.bindDN();
      expect(() => {
        ldap.bindDN();
      }).not.toThrow();
      expect(() => {
        ldap.bindDN();
      }).not.toThrow();

      await ldap.bindDN();

      const users = await ldap.search('uid=artvandelay', ['idNumber']);
      expect(users.length).toBe(1);
      expect(users[0].idNumber).toBe(1234567);
      expect(ldap.queue.length).toBe(0);

      ldap.destroy();
    });
  });

  test('concurrent searches', async () => {
    const ldap = new SimpleLDAP(config);

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

    const results = await promiseMap(uids, (uid) =>
      ldap
        .search(`uid=${uid}`)
        .then((users) => (users.length ? users[0] : null)),
    );

    expect(results.length).toBe(uids.length);
    expect(results[0].uid).toBe('artvandelay');
    expect(results[1].uid).toBe('ebenes');
    expect(results[4]).toBe(null);
    expect(ldap.queue.length).toBe(0);

    ldap.destroy();
  });

  describe('ldap.search', () => {
    it('returns array of results', async () => {
      const ldap = new SimpleLDAP(config);

      const expected = {
        dn: 'uid=artvandelay,dc=users,dc=localhost',
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
      await ldap.bindDN(dn, password);

      const data = await ldap.search(filter, attributes);
      expect(data).toEqual([expected]);
      expect(ldap.queue.length).toBe(0);
      ldap.destroy();
    });
  });

  it('throws if config lacks dn and password', async () => {
    const { url, base } = config;
    const ldap = new SimpleLDAP({ url, base });
    await expect(ldap.search('uid=artvandelay')).rejects.toThrow(
      /No bind credentials/,
    );
    ldap.destroy();
  });

  // See Issue #9:
  // "some errors are emitted rather than calling the error callback ...
  // to reproduce ... search against a url which doesnt respond"
  it('handle errors when bad LDAP url', async () => {
    // invalid LDAP url
    const url = 'ldap://0.0.0.0:9999';
    const { base, dn, password } = config;
    const ldap = new SimpleLDAP({
      url,
      base,
      dn,
      password,
    });

    await expect(ldap.search('uid=artvandelay')).rejects.toThrow();
    ldap.destroy();
  });
});
