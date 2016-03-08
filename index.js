var NedbDatastore = require('nedb')
var thenify = require('thenify')

function datastore(options) {
	options = options || { }
	var DB = new NedbDatastore(options)

	DB.cfind = function(spec, opts) {
		var c = DB.find(spec, opts)
		c.execAsync = thenify(c.exec.bind(c))
		return c
	}

	DB.cfindOne = function(spec, opts) {
		var c = DB.findOne(spec, opts)
		c.execAsync = thenify(c.exec.bind(c))
		return c
	}

	for (var mbr in DB) {
		if (typeof DB[mbr] !== 'function')
			continue
		DB[mbr + 'Async'] = thenify(DB[mbr])
	}

	return DB
}

// so that import { datastore } still works:
datastore.datastore = datastore

module.exports = datastore
