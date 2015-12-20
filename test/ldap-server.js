import process from 'process';
import ldap from 'ldapjs';
import db from './mockData';

function setupBind(server) {

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

// returns a promise to start a test ldap server
export default function start() {
  return new Promise((resolve, reject) => {
    const server = ldap.createServer();
    setupSearch(server);
    server.listen(1389, (err) => {
      if (err) throw reject(err);

      console.log(`LDAP server started on ${server.url}`);

      // setup clean close on process exit
      // fixes ADDRINUSE error
      process.on('exit', server.close.bind(server));
      process.on('uncaughtException', server.close.bind(server));
      process.on('SIGTERM', server.close.bind(server));

      resolve();
    });
  });
}
