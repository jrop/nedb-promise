import assert from 'assert'
import datastore from '../index'
import path from 'path'
import _ from 'lodash'

function makeDB(opts) {
	let filename = path.resolve(path.join(__dirname, 'test-db.json'))
	opts = _.extend({ filename }, opts || { })
	return datastore(opts)
}

describe('datastore', () => {
	let DB = makeDB({ autoload: true })

	//
	// before each: clear and then stage data
	//
	beforeEach(async (done) => {
		try {
			await DB.removeAsync({}, { multi: true })
			
			await DB.insertAsync([{
				num: 1,
				alpha: 'a'
			}, {
				num: 2,
				alpha: 'b'
			}, {
				num: 3,
				alpha: 'c'
			}])
		} catch (e) {
			return done(e)
		}
		done()
	})

	describe('#findAsync()', () => {
		it('should return them all', async (done) => {
			try {
				assert.equal((await DB.findAsync({})).length, 3)
			} catch (e) {
				return done(e)
			}
			done()
		})

		it('should only return 1', async (done) => {
			try {
				assert.equal((await DB.findAsync({ num: 3 })).length, 1)
			} catch (e) {
				return done(e)
			}
			done()
		})

		it ('should project', async (done) => {
			try {
				let doc = await DB.cfind({ num: 3 })
					.projection({ num: 1, _id: 0 })
					.execAsync()

				doc = doc[0]
				assert.equal(doc.num, 3)
				assert.equal(doc.alpha, undefined)
			} catch (e) {
				return done(e)
			}
			done()
		})

		it('should sort', async (done) => {
			try {
				let docs = await DB.cfind({})
					.sort({ num: -1 })
					.execAsync()

				docs = _.chain(docs)
					.map(d => d.num)
					.value()

				let assertion = docs[0] == 3 && docs[1] == 2 && docs[2] == 1
				assert(assertion)
			} catch (e) {
				return done(e)
			}
			done()
		})
	})

	describe('#findOneAsync()', () => {
		it('should only return one', async (done) => {
			try {
				let doc = await DB.findOneAsync({ num: 2 })
				assert.equal(doc.num, 2)
			} catch (e) {
				return done(e)
			}
			done()
		})

		it('should project', async(done) => {
			try {
				let doc = await DB.cfindOne({ num: 2 }, true)
					.projection({ num: 1, _id: false })
					.execAsync()

				assert.equal(doc.num, 2)
				assert.equal(doc.alpha, undefined)
			} catch (e) {
				return done(e)
			}
			done()
		})
	})

	describe('#countAsync()', () => {
		it('should return the number of documents in the database', async (done) => {
			try {
				let count = await DB.countAsync({})

				assert.equal(count, 3)
			} catch (e) {
				return done(e)
			}
			done()
		})
	})

	describe('#insertAsync()', () => {
		it('should insert two documents', async (done) => {
			try {
				let beforeCount = await DB.countAsync({})
				let docs = await DB.insertAsync([{
					num: 4,
					alpha: 'd'
				}, {
					num: 5,
					alpha: 'e'
				}])
				let afterCount = await DB.countAsync({})

				assert.equal(afterCount - beforeCount, 2)
			} catch (e) {
				return done(e)
			}
			done()
		})
	})

	describe('#updateAsync()', () => {
		it('should update a document', async (done) => {
			try {
				await DB.updateAsync({ num: 3 }, { $set: { updated: true } })
				let updated = await DB.findOneAsync({ num: 3 })
				assert(updated.updated)
			} catch (e) {
				return done(e)
			}
			done()
		})

		it('should insert a new document', async(done) => {
			try {
				let beforeCount = await DB.countAsync({})
				await DB.updateAsync({ num: 4 }, {
					num: 4,
					alpha: 'f'
				}, { upsert: true })
				let afterCount = await DB.countAsync({})

				assert.equal(afterCount - beforeCount, 1)
			} catch (e) {
				return done(e)
			}
			done()
		})
	})

	describe('#removeAsync()', () => {
		it('should remove a document', async (done) => {
			try {
				let beforeCount = await DB.countAsync({})
				await DB.removeAsync({})
				let afterCount = await DB.countAsync({})

				assert.equal(beforeCount - afterCount, 1)
			} catch (e) {
				return done(e)
			}
			done()
		})

		it('should remove all documents', async (done) => {
			try {
				await DB.removeAsync({}, { multi: true })
				let afterCount = await DB.countAsync({})

				assert.equal(afterCount, 0)
			} catch (e) {
				return done(e)
			}
			done()
		})
	})
})
