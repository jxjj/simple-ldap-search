export default [
  {
    dn: 'uid=artvandelay, dc=users, dc=localhost',
    attributes: {
      idNumber: 1234567,
      uid: 'artvandelay',
      givenName: 'Art',
      sn: 'Vandelay',
      telephoneNumber: '555-123-4567',
      email: 'artvandelay@vandelayindustries.com',
      objectclass: 'unixUser',
    },
  },
  {
    dn: 'uid=ebenes, dc=users, dc=localhost',
    attributes: {
      idNumber: 765432,
      uid: 'ebenes',
      givenName: 'Elaine',
      sn: 'Benes',
      telephoneNumber: '555-663-5246',
      email: 'ebenes@jpeterman.com',
      objectclass: 'unixUser',
    },
  },
];
