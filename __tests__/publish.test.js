
import publish from '../src/libs/publish'
import GitHub from '../src/libs/github'
import parse from '../src/libs/parse'

describe('publish', () => {
	const likedURL = 'https://domain.tld'

	const form = {
		'h': 'entry',
		'content': 'Content goes here\r\nAnd thats all',
		'name': 'Title',
		'category': [ 'one', 'two', 'three' ],
		'mp-slug': 'this-is-a-slug',
		'like-of': likedURL,
		'bookmark-of': likedURL,
		'in-reply-to': likedURL,
		'rsvp': 'maybe'
	}

	beforeEach(() => {
		console.log = jest.fn()
		console.error = jest.fn()
	})

	describe('addContent: SUCCESS', () => {
		let entry
		beforeEach(() => {
			const getFile = jest.spyOn(GitHub, 'getFile')
			getFile.mockReturnValue(false)
			const createFile = jest.spyOn(GitHub, 'createFile')
			createFile.mockReturnValue(true)
			entry = {
				'h': form['h']
			}
		})

		test('add note', async () => {
			entry['content'] = form['content']
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('notes/')
		})

		test('add post', async () => {
			entry['name'] = 'Title'
			entry['content'] = form['content']
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('posts/')
		})

		test('add like', async () => {
			const getPageTitle = jest.spyOn(parse, 'getPageTitle')
			getPageTitle.mockReturnValue('PAGE TITLE')

			entry['like-of'] = 'https://domain.tld'
			const res = await publish.addContent(entry)
			expect(getPageTitle.mock.calls.length).toBe(1)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('posts/')
		})

		test('add bookmark', async () => {
			entry['name'] = 'Title'
			entry['bookmark-of'] = 'https://domain.tld'
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('posts/')
		})

		test('add reply', async () => {
			entry['in-reply-to'] = 'Title'
			entry['content'] = form['content']
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('notes/')
		})

		test('add RSVP', async () => {
			entry['in-reply-to'] = 'Title'
			entry['rsvp'] = 'yes'
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('filename')
			expect(res.filename).toContain('notes/')
		})
	})

	describe('addContent: FAIL', () => {
		let entry
		beforeEach(() => {
			entry = {
				'h': form['h']
			}
		})

		test('no content or name', async () => {
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('error', 'nothing to add')
		})

		test('bookmark without name', async () => {
			entry['bookmark-of'] = 'https://domain.tld'
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('error', 'nothing to add')
		})

		test('reply without content (or RSVP)', async () => {
			entry['in-reply-to'] = 'https://domain.tld'
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('error', 'nothing to add')
		})

		test('RSVP without reply', async () => {
			entry['rsvp'] = 'yes'
			const res = await publish.addContent(entry)
			expect(res).toHaveProperty('error', 'nothing to add')
		})
	})
})
