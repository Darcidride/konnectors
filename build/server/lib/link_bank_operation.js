// Generated by CoffeeScript 1.9.1
var BankOperation, BankOperationLinker, async, moment,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

async = require('async');

moment = require('moment');

BankOperation = require('../models/bankoperation');

BankOperationLinker = (function() {
  function BankOperationLinker(options) {
    this.linkOperation = bind(this.linkOperation, this);
    this.linkOperationIfExist = bind(this.linkOperationIfExist, this);
    this.log = options.log;
    this.model = options.model;
    this.identifier = options.identifier.toLowerCase();
    this.amountDelta = options.amountDelta || 0;
    this.minAmountDelta = options.minAmountDelta || this.amountDelta;
    this.maxAmountDelta = options.maxAmountDelta || this.amountDelta;
    this.dateDelta = options.dateDelta || 15;
    this.minDateDelta = options.minDateDelta || this.dateDelta;
    this.maxDateDelta = options.maxDateDelta || this.dateDelta;
  }

  BankOperationLinker.prototype.link = function(entries, callback) {
    return async.eachSeries(entries, this.linkOperationIfExist, callback);
  };

  BankOperationLinker.prototype.linkOperationIfExist = function(entry, callback) {
    var endDate, endkey, startDate, startkey;
    startDate = moment(entry.date).subtract(this.minDateDelta, 'days');
    endDate = moment(entry.date).add(this.maxDateDelta, 'days');
    startkey = (startDate.format("YYYY-MM-DDT00:00:00.000")) + "Z";
    endkey = (endDate.format("YYYY-MM-DDT00:00:00.000")) + "Z";
    return BankOperation.all({
      startkey: startkey,
      endkey: endkey
    }, (function(_this) {
      return function(err, operations) {
        if (err) {
          return callback(err);
        }
        return _this.linkRightOperation(operations, entry, callback);
      };
    })(this));
  };

  BankOperationLinker.prototype.linkRightOperation = function(operations, entry, callback) {
    var amount, i, len, operation, operationAmount, operationToLink;
    operationToLink = null;
    try {
      amount = parseFloat(entry.amount);
    } catch (_error) {
      amount = 0;
    }
    for (i = 0, len = operations.length; i < len; i++) {
      operation = operations[i];
      operationAmount = operation.amount;
      if (operationAmount < 0) {
        operationAmount = operationAmount * -1;
      }
      if (operation.title.toLowerCase().indexOf(this.identifier) >= 0 && (amount - this.minAmountDelta) <= operationAmount && (amount + this.maxAmountDelta) >= operationAmount) {
        operationToLink = operation;
      }
    }
    if (operationToLink == null) {
      return callback();
    } else if (operationToLink.binary === void 0) {
      return this.linkOperation(operationToLink, entry, callback);
    } else if (operationToLink.binary.file == null) {
      return this.linkOperation(operationToLink, entry, callback);
    } else {
      return callback();
    }
  };

  BankOperationLinker.prototype.linkOperation = function(operation, entry, callback) {
    var key;
    key = (moment(entry.date).format("YYYY-MM-DDT00:00:00.000")) + "Z";
    return this.model.request('byDate', {
      key: key
    }, (function(_this) {
      return function(err, entries) {
        if (err) {
          _this.log.raw(err);
          return callback();
        } else if (entries.length === 0) {
          return callback();
        } else {
          entry = entries[0];
          return operation.setBinaryFromFile(entry.fileId, function(err) {
            if (err) {
              _this.log.raw(err);
            } else {
              _this.log.debug("Binary " + operation.binary.file.id + " linked with operation:\n" + operation.title + " - " + operation.amount);
            }
            return callback();
          });
        }
      };
    })(this));
  };

  return BankOperationLinker;

})();

module.exports = function(options) {
  return function(requiredFields, entries, data, next) {
    var linker;
    linker = new BankOperationLinker(options);
    return linker.link(entries.fetched, next);
  };
};