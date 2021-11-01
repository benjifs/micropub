/* eslint-disable no-useless-escape */

import dotenv from 'dotenv'
import nock from 'nock'
import source from '../src/libs/source'

dotenv.config({ path: '.env.example' })

describe('source', () => {
	const url = 'https://api.github.com/'
	const path = `/repos/${process.env.GITHUB_USER}/${process.env.GITHUB_REPO}/contents/`
	const branch = process.env.GIT_BRANCH ? `ref=${process.env.GIT_BRANCH}` : ''

	const filename = 'src/articles/123.md'
	const filePath = `${path}${encodeURIComponent(filename)}`

	const fm = '---\n' +
	'date: 2021-09-09T12:23:34.120Z\n' +
	'title: "Title"\n' +
	'tags:\n' +
	' - one\n' +
	' - two\n' +
	' - three\n' +
	'updated: 2021-10-09T12:23:34.120Z\n' +
	'---\n' +
	'\n' +
	'Content goes here\r\nAnd thats all'
	const b64 = Buffer.from(fm).toString('base64')
	const sha = 'abc123'

	beforeEach(() => {
		console.log = jest.fn()
		console.error = jest.fn()
		nock.disableNetConnect()
	})

	afterEach(() => {
		nock.cleanAll()
	})

	test('invalid file', async () => {
		const mock = nock(url)
			.get(`${filePath}?${branch}`)
			.reply(404)

		const res = await source.get('https://domain.tld/articles/123')
		mock.done()
		expect(res).toHaveProperty('error')
	})

	test('valid file', async () => {
		const mock = nock(url)
			.get(`${filePath}?${branch}`)
			.reply(200, { content: b64, sha })

		const res = await source.get('https://domain.tld/articles/123')
		mock.done()
		expect(res).toHaveProperty('source')
		expect(res.source).toHaveProperty('type')
		expect(res.source).toHaveProperty('properties')
		const { type, properties } = res.source
		expect(type).toBe('h-entry')
		expect(properties).toHaveProperty('content')
		expect(properties).toHaveProperty('category')
		expect(properties).toHaveProperty('name')
	})

	test('valid file with properties', async () => {
		const mock = nock(url)
			.get(`${filePath}?${branch}`)
			.reply(200, { content: b64, sha })

		const res = await source.get('https://domain.tld/articles/123', [ 'content', 'name', 'mp-slug' ])
		mock.done()
		expect(res).toHaveProperty('source')
		expect(res.source).toHaveProperty('properties')
		const { properties } = res.source
		expect(properties).toHaveProperty('content')
		expect(properties).toHaveProperty('name')
		expect(properties).not.toHaveProperty('category')
		expect(properties).not.toHaveProperty('mp-slug')
	})
})
