import ldap from 'ldapjs';
import userList from './mockData';
import Promise from 'bluebird';

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

function slowSearchHandler(req, res, next) {
  const matchingUsers = [];
  userList.forEach((user) => {
    if (req.filter.matches(user.attributes)) {
      matchingUsers.push(user);
    }
  });
  // send with slow times
  Promise.map(matchingUsers, user => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        res.send(user);
        return resolve();
      }, 1000);
    });
  })
  .then(() => {
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

  slowConnection() {
    this.server.search('dc=localhost', slowSearchHandler);
  }

  normalConnection() {
    this.server.search('dc=localhost', searchHandler);
  }
}

export default TestLDAPServer;
