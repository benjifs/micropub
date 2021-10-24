/* eslint-disable no-useless-escape */

import dotenv from 'dotenv'
import nock from 'nock'
import GitHub from '../src/libs/github'

dotenv.config({ path: '.env.example' })

describe('GitHub', () => {
	const url = 'https://api.github.com/'
	const path = `/repos/${process.env.GITHUB_USER}/${process.env.GITHUB_REPO}/contents/`
	const branch = process.env.GIT_BRANCH ? `ref=${process.env.GIT_BRANCH}` : ''

	const filename = 'src/posts/123.md'
	const filePath = `${path}${encodeURIComponent(filename)}`

	const content = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.'
	const b64 = Buffer.from(content).toString('base64')
	const file = { content: b64, sha: 'abc123' }

	const jsonBody = {
		'branch': process.env.GIT_BRANCH,
		'committer': {
			'email': process.env.AUTHOR_EMAIL,
			'name': process.env.AUTHOR_NAME
		}
	}

	beforeEach(() => {
		console.log = jest.fn()
		console.error = jest.fn()
		nock.disableNetConnect()
	})

	afterEach(() => {
		nock.cleanAll()
	})

	describe('createFile', () => {
		test('new file', async () => {
			const mock = nock(url)
				.put(filePath, {
					'content': b64,
					'message': `add: ${filename}`,
					//
					...jsonBody
				})
				.reply(200, {
					'content': {
						'path': filename,
					}
				})

			const res = await GitHub.createFile(filename, content)
			mock.done()
			expect(res).toBe(filename)
		})

		test('file exists', async () => {
			const mock = nock(url)
				.put(filePath, {
					'content': b64,
					'message': `add: ${filename}`,
					//
					...jsonBody
				})
				.reply(422, {
					'message': 'Invalid request.\n\n\"sha\" wasn\'t supplied.'
				})

			const res = await GitHub.createFile(filename, content)
			mock.done()
			expect(res).toBeFalsy()
		})
	})

	describe('updateFile', () => {
		test('update file', async () => {
			const mock = nock(url)
				.put(filePath, {
					'content': b64,
					'sha': file.sha,
					'message': `update: ${filename}`,
					//
					...jsonBody
				})
				.reply(200, {
					'content': {
						'path': filename,
					}
				})

			const res = await GitHub.updateFile(filename, content, file)
			mock.done()
			expect(res).toBe(filename)
		})

		test('incorrect sha', async () => {
			const mock = nock(url)
				.put(filePath, {
					'content': b64,
					'sha': file.sha,
					'message': `update: ${filename}`,
					//
					...jsonBody
				})
				.reply(409, {
					'message': `${filename} does not match ${file.sha}`
				})

			const res = await GitHub.updateFile(filename, content, file)
			mock.done()
			expect(res).toBeFalsy()
		})
	})

	describe('uploadImage', () => {
		test('valid file', async () => {
			const mock = nock(url)
				.put(filePath, {
					'content': b64,
					'message': `upload: ${filename}`,
					//
					...jsonBody
				})
				.reply(200, {
					'content': {
						'path': filename,
					}
				})

			const res = await GitHub.uploadImage(filename, {
				content: content
			})
			mock.done()
			expect(res).toBe(filename)
		})
	})

	describe('getFile', () => {
		test('file exists', async () => {
			const mock = nock(url)
				.get(`${filePath}?${branch}`)
				.reply(200, file)

			const res = await GitHub.getFile(filename)
			mock.done()
			expect(res).toHaveProperty('content', content)
			expect(res).toHaveProperty('sha', file.sha)
		})

		test('file does not exists', async () => {
			const mock = nock(url)
				.get(`${filePath}?${branch}`)
				.reply(404)

			const res = await GitHub.getFile(filename)
			mock.done()
			expect(res).toBeFalsy()
		})
	})

	describe('getDirectory', () => {
		const dir = 'src'
		const item = {
			'type': 'file',
			'name': 'octokit.rb',
			'path': 'lib/octokit.rb',
			'sha': 'fff6fe3a23bf1c8ea0692b4a883af99bee26fd3b'
		}

		test('directory exists', async () => {
			const mock = nock(url)
				.get(`${path}${encodeURIComponent(dir)}?${branch}`)
				.reply(200, [ item, item, item ])

			const res = await GitHub.getDirectory(dir)
			mock.done()
			expect(res).toHaveProperty('files')
			expect(res.files).toHaveLength(3)
		})

		test('directory does not exists', async () => {
			const mock = nock(url)
				.get(`${path}${encodeURIComponent(dir)}?${branch}`)
				.reply(404)

			const res = await GitHub.getDirectory(dir)
			mock.done()
			expect(res).toBeFalsy()
		})
	})

	describe('deleteFile', () => {
		test('file exists', async () => {
			const mock = nock(url)
				.delete(filePath, {
					'sha': file.sha,
					'message': `delete: ${filename}`,
					//
					...jsonBody
				})
				.reply(200, {
					'commit': {
						'sha': '7638417db6d59f3c431d3e1f261cc637155684cd'
					}
				})

			const res = await GitHub.deleteFile(filename, file)
			mock.done()
			expect(res).toBe(filename)
		})

		test('file does not exists', async () => {
			const mock = nock(url)
				.delete(filePath, {
					'sha': file.sha,
					'message': `delete: ${filename}`,
					//
					...jsonBody
				})
				.reply(404)

			const res = await GitHub.deleteFile(filename, file)
			mock.done()
			expect(res).toBeFalsy()
		})
	})
})
