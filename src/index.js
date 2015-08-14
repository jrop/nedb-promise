import NedbDatastore from 'nedb'
import bb from 'bluebird'

export default function datastore(options = {}) {
	let DB = new NedbDatastore(options)
	DB = bb.Promise.promisifyAll(DB)

	DB.cfind = function(spec, opts) {
		let c = DB.find(spec, opts)
		c.execAsync = bb.Promise.promisify(c.exec, c)
		return c
	}

	DB.cfindOne = function(spec, opts) {
		let c = DB.findOne(spec, opts)
		c.execAsync = bb.Promise.promisify(c.exec, c)
		return c
	}

	return DB
}

export { datastore }
