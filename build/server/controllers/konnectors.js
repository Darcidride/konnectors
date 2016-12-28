// Generated by CoffeeScript 1.10.0
var Konnector, handleNotification, konnectorHash, log;

Konnector = require('../models/konnector');

konnectorHash = require('../lib/konnector_hash');

handleNotification = require('../lib/notification_handler');

log = require('printit')({
  prefix: 'konnector controller'
});

module.exports = {
  getKonnector: function(req, res, next) {
    return Konnector.find(req.params.konnectorId, function(err, konnector) {
      var konnectorModule;
      if (err) {
        return next(err);
      } else if (konnector == null) {
        return res.sendStatus(404);
      } else {
        konnector.injectEncryptedFields();
        konnector.appendConfigData();
        konnector.checkProperties();
        konnectorModule = require("../konnectors/" + konnector.slug);
        if (konnectorModule.customView != null) {
          konnector.customView = konnectorModule.customView;
        }
        req.konnector = konnector;
        return next();
      }
    });
  },
  show: function(req, res, next) {
    return res.send(req.konnector);
  },
  remove: function(req, res, next) {
    var data;
    data = {
      lastAutoImport: null,
      importErrorMessage: null,
      accounts: [],
      password: '{}'
    };
    return req.konnector.updateAttributes(data, function(err, konnector) {
      if (err) {
        return next(err);
      }
      return res.status(204).send(konnector);
    });
  },
  "import": function(req, res, next) {
    var date;
    if (req.konnector.isImporting) {
      return res.send(400, {
        message: 'konnector is importing'
      });
    } else {
      if (req.body.date != null) {
        if (req.body.date !== '') {
          date = req.body.date;
        }
        delete req.body.date;
      }
      return req.konnector.updateFieldValues(req.body, function(err) {
        var poller;
        if (err != null) {
          return next(err);
        } else {
          poller = require("../lib/poller");
          poller.add(date, req.konnector);
          if (date == null) {
            req.konnector["import"](function(err, notifContent) {
              if (err != null) {
                return log.error(err);
              } else {
                return handleNotification(req.konnector, notifContent);
              }
            });
          }
          return res.status(200).send({
            success: true
          });
        }
      });
    }
  },
  redirect: function(req, res, next) {
    var account, accounts, e, error, k, ref, v;
    try {
      accounts = req.konnector.accounts || [];
      account = accounts[req.params.accountId] || {};
      ref = req.query;
      for (k in ref) {
        v = ref[k];
        account[k] = v;
      }
      account.redirectPath = req.originalUrl;
      accounts[req.params.accountId] = account;
    } catch (error) {
      e = error;
      return next(e);
    }
    return req.konnector.updateFieldValues({
      accounts: accounts
    }, function(err) {
      if (err) {
        return next(err);
      }
      return res.redirect('../../..' + ("/#/category/" + req.konnector.category + "/" + req.konnector.slug));
    });
  }
};
