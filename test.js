'use strict'

const assert = require('assert')
const co = require('co')
const datastore = require('./index')
const path = require('path')
const _ = require('lodash')

function makeDB(opts) {
	const filename = path.resolve(path.join(__dirname, 'test-db.json'))
	opts = _.extend({ filename }, opts || { })
	return datastore(opts)
}

describe('datastore', () => {
	const DB = makeDB({ autoload: true })

	//
	// before each: clear and then stage data
	//
	beforeEach(co.wrap(function * () {
		yield DB.removeAsync({ }, { multi: true })
		
		yield DB.insertAsync([ {
			num: 1,
			alpha: 'a'
		}, {
			num: 2,
			alpha: 'b'
		}, {
			num: 3,
			alpha: 'c'
		} ])
	}))

	describe('#findAsync()', () => {
		it('should return them all', co.wrap(function * () {
			assert.equal((yield DB.findAsync({})).length, 3)
		}))

		it('should only return 1', co.wrap(function * () {
			assert.equal((yield DB.findAsync({ num: 3 })).length, 1)
		}))

		it ('should project', co.wrap(function * () {
			let doc = yield DB.cfind({ num: 3 })
				.projection({ num: 1, _id: 0 })
				.execAsync()

			doc = doc[0]
			assert.equal(doc.num, 3)
			assert.equal(doc.alpha, undefined)
		}))

		it('should sort', co.wrap(function * () {
			let docs = yield DB.cfind({})
				.sort({ num: -1 })
				.execAsync()

			docs = _.chain(docs)
				.map(d => d.num)
				.value()

			let assertion = docs[0] == 3 && docs[1] == 2 && docs[2] == 1
			assert(assertion)
		}))
	})

	describe('#findOneAsync()', () => {
		it('should only return one', co.wrap(function * () {
			let doc = yield DB.findOneAsync({ num: 2 })
			assert.equal(doc.num, 2)
		}))

		it('should project', co.wrap(function * () {
			let doc = yield DB.cfindOne({ num: 2 }, true)
				.projection({ num: 1, _id: false })
				.execAsync()

			assert.equal(doc.num, 2)
			assert.equal(doc.alpha, undefined)
		}))
	})

	describe('#countAsync()', () => {
		it('should return the number of documents in the database', co.wrap(function * () {
			let count = yield DB.countAsync({})
			assert.equal(count, 3)
		}))
	})

	describe('#insertAsync()', () => {
		it('should insert two documents', co.wrap(function * () {
			let beforeCount = yield DB.countAsync({})
			let docs = yield DB.insertAsync([{
				num: 4,
				alpha: 'd'
			}, {
				num: 5,
				alpha: 'e'
			}])
			let afterCount = yield DB.countAsync({})

			assert.equal(afterCount - beforeCount, 2)
		}))
	})

	describe('#updateAsync()', () => {
		it('should update a document', co.wrap(function * () {
			yield DB.updateAsync({ num: 3 }, { $set: { updated: true } })
			let updated = yield DB.findOneAsync({ num: 3 })
			assert(updated.updated)
		}))

		it('should insert a new document', co.wrap(function * () {
			let beforeCount = yield DB.countAsync({})
			yield DB.updateAsync({ num: 4 }, {
				num: 4,
				alpha: 'f'
			}, { upsert: true })
			let afterCount = yield DB.countAsync({})

			assert.equal(afterCount - beforeCount, 1)
		}))
	})

	describe('#removeAsync()', () => {
		it('should remove a document', co.wrap(function * () {
			let beforeCount = yield DB.countAsync({})
			yield DB.removeAsync({})
			let afterCount = yield DB.countAsync({})

			assert.equal(beforeCount - afterCount, 1)
		}))

		it('should remove all documents', co.wrap(function * () {
			yield DB.removeAsync({}, { multi: true })
			let afterCount = yield DB.countAsync({})

			assert.equal(afterCount, 0)
		}))
	})
})
