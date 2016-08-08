import ldap from 'ldapjs';
import userList from './mockData';

function authHandler(req, res, next) {
  if (req.dn.toString() !== 'cn=root' || req.credentials !== 'secret') {
    return next(new ldap.InvalidCredentialsError());
  }
  res.end();
  return next();
}

function searchHandler(req, res, next) {
  // console.log(`LDAPSERVER: testing against filter '${req.filter}'`);

  // cycle through each user and attr
  userList.forEach((user) => {
    // const { uid } = user.attributes;
    if (req.filter.matches(user.attributes)) {
      // console.log(`LDAPSERVER: User '${uid}' -> MATCH`);
      res.send(user);
    } else {
      // console.log(`LDAPSERVER: User '${uid}' -> no match`);
    }
  });

  res.end();
  next();
}

class TestLDAPServer {
  constructor() {
    this.server = ldap.createServer();
    // setup auth
    this.server.bind('cn=root', authHandler);

    // setup search
    this.server.search('dc=localhost', searchHandler);
  }

  // returns a promise to start a test ldap server
  start() {
    const self = this;

    return new Promise((resolve, reject) => {
      self.server.listen(1389, (err) => {
        if (err) {
          // console.error(`LDAP SERVER: Error listening: ${err}`);
          return reject(err);
        }

        // console.log(`LDAP server started on ${self.server.url}`);
        return resolve();
      });
    });
  }
  stop() {
    this.server.close();
    return Promise.resolve();
  }
}

export default TestLDAPServer;
