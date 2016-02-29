var NedbDatastore = require('nedb')
var thenify = require('thenify')

function fromInstance(nedbInstance) {
	var newDB = { nedb: nedbInstance }

	var methods = [ 'loadDatabase', 'insert', 'find', 'findOne', 'count', 'update', 'remove', 'ensureIndex', 'removeIndex' ]
	for (var i = 0; i < methods.length; ++i) {
		var m = methods[i]
		newDB[m] = thenify(nedbInstance[m].bind(nedbInstance))
	}

	newDB.cfind = function(query, projections) {
		var cursor = nedbInstance.find(query, projections)
		cursor.exec = thenify(cursor.exec.bind(cursor))
		return cursor
	}

	newDB.cfindOne = function(query, projections) {
		var cursor = nedbInstance.findOne(query, projections)
		cursor.exec = thenify(cursor.exec.bind(cursor))
		return cursor
	}

	newDB.ccount = function(query) {
		var cursor = nedbInstance.count(query)
		cursor.exec = thenify(cursor.exec.bind(cursor))
		return cursor
	}

	return newDB
}

function datastore(options) {
	var nedbInstance = new NedbDatastore(options)
	return fromInstance(nedbInstance)
}

// so that import { datastore } still works:
datastore.datastore = datastore
datastore.fromInstance = fromInstance

module.exports = datastore
