import ldap from 'ldapjs';
import promiseMap from 'p-map';
import userList from './mockData';

function authorize(req, res, next) {
  if (!req.connection.ldap.bindDN.equals('cn=root')) {
    return next(new ldap.InsufficientAccessRightsError());
  }

  return next();
}

function authHandler(req, res, next) {
  // introduce lag
  setTimeout(() => {
    if (req.dn.toString() !== 'cn=root' || req.credentials !== 'secret') {
      return next(new ldap.InvalidCredentialsError());
    }
    res.end();
    return next();
  }, 500);
}

function searchHandler(req, res, next) {
  userList.forEach(user => {
    if (req.filter.matches(user.attributes)) {
      res.send(user);
    }
  });

  res.end();
  next();
}

function slowSearchHandler(req, res, next) {
  const matchingUsers = [];
  userList.forEach(user => {
    if (req.filter.matches(user.attributes)) {
      matchingUsers.push(user);
    }
  });
  // send with slow times
  promiseMap(
    matchingUsers,
    user =>
      new Promise(resolve => {
        setTimeout(() => {
          res.send(user);
          return resolve();
        }, 1000);
      }),
  ).then(() => {
    res.end();
    next();
  });
  next();
}

class TestLDAPServer {
  constructor() {
    this.server = ldap.createServer();
    // setup auth
    this.server.bind('cn=root', authHandler);

    // normal search
    this.server.search('dc=localhost', authorize, searchHandler);
  }

  // returns a promise to start a test ldap server
  start() {
    const self = this;

    return new Promise((resolve, reject) => {
      self.server.listen(1389, err => {
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

  slowConnection() {
    this.server.search('dc=localhost', authorize, slowSearchHandler);
  }

  normalConnection() {
    this.server.search('dc=localhost', authorize, searchHandler);
  }
}

export default TestLDAPServer;
