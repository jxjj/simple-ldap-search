import process from 'process';
import ldap from 'ldapjs';
import db from './mockData';

function setupBind(server) {
  server.bind('cn=root', (req, res, next) => {
    if (req.dn.toString() !== 'cn=root' || req.credentials !== 'secret') {
      return next(new ldap.InvalidCredentialsError());
    }

    res.end();
    return next();
  });
}

function setupSearch(server) {
  server.search('dc=localhost', (req, res, next) => {
    db.forEach((user) => {
      if (req.filter.matches(user.attributes)) {
        res.send(user);
      }
    });
    res.end();
    next();
  });
}


export default class TestLDAPServer {
  constructor() {
    this.state = 'STOPPED';
    this.server = ldap.createServer();
  }

  // returns a promise to start a test ldap server
  start() {
    return new Promise((resolve, reject) => {
      const server = this.server;
      setupBind(server);
      setupSearch(server);
      server.listen(1389, (err) => {
        if (err) throw reject(err);

        console.log(`LDAP server started on ${server.url}`);

        // setup clean close on process exit
        // fixes ADDRINUSE error
        process.on('exit', server.close.bind(server));
        process.on('uncaughtException', server.close.bind(server));
        process.on('SIGTERM', server.close.bind(server));

        this.state = 'RUNNING';

        resolve();
      });
    });
  }

  stop() {
    this.server.close(); // not async?
    return Promise.resolve();
  }
}
