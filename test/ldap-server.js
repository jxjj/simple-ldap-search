import ldapjs from 'ldapjs';
// import Promise from 'bluebird';
// const fs = Promise.promisifyAll(require('fs'));
// import fs from 'fs';
import mockData from './mockData';

function setupBind(server) {
  server.bind('cn=root', (req, res, next) => {
    if (req.dn.toString() !== 'cn=root' ||
        req.credentials !== 'secret') {
      return next(new ldapjs.InvalidCredentialsError());
    }

    res.end();
    return next();
  });
}

function loadPasswdFile(req, res, next) {
  req.users = {};

  mockData.forEach((user) => {
    const {
      dn,
      idNumber,
      uid,
      givenName,
      sn,
      telephoneNumber,
    } = user;

    req.users[dn] = {
      dn,
      attributes: {
        idNumber,
        uid,
        givenName,
        sn,
        telephoneNumber,
        objectClass: 'posixAccount',
      },
    };
  });

  return next();
}

function authorize(req, res, next) {
  if (!req.connection.ldap.bindDN.equals('cn=root')) {
    return next(new ldapjs.InsufficientAccessRightsError());
  }

  return next();
}

function setupSearch(server, pre) {
  server.search('dc=users', pre, (req, res, next) => {
    Object.keys(req.users).forEach((user) => {
      if (req.filter.matches(req.users[user].attributes)) {
        res.send(req.users[user]);
      }
    });

    res.end();
    return next();
  });
}

function serverStart(server, port = 1389) {
  server.listen(port, () => {
    console.log('LDAP server listening at %s', server.url);
  });
}

export default function startLDAPServer(port = 1389) {
  const server = ldapjs.createServer();
  const pre = [authorize, loadPasswdFile];

  setupBind(server);
  setupSearch(server, pre);
  serverStart(server, port);
  return server;
}
