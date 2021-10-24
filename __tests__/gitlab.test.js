/* eslint-disable no-useless-escape */

import dotenv from 'dotenv'
import nock from 'nock'
import GitLab from '../src/libs/gitlab'

dotenv.config({ path: '.env.example' })

describe('GitLab', () => {
	const url = 'https://gitlab.com/'
	const path = `/api/v4/projects/${process.env.GITLAB_PROJECT_ID}`
	const filesAPI = `${path}/repository/files/`
	const treeAPI = `${path}/repository/tree/`
	const branch = process.env.GIT_BRANCH ? `ref=${process.env.GIT_BRANCH}` : ''

	const filename = 'src/posts/123.md'
	const filePath = `${filesAPI}${encodeURIComponent(filename)}`

	const content = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.'
	const b64 = Buffer.from(content).toString('base64')
	const file = { content: b64, sha: 'abc123' }

	const jsonBody = {
		'branch': process.env.GIT_BRANCH,
		'author_email': process.env.AUTHOR_EMAIL,
		'author_name': process.env.AUTHOR_NAME
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
				.post(filePath, {
					'content': content,
					'commit_message': `add: ${filename}`,
					//
					...jsonBody
				})
				.reply(200, {
					'file_path': filename,
					'branch': process.env.GIT_BRANCH
				})

			const res = await GitLab.createFile(filename, content)
			mock.done()
			expect(res).toBe(filename)
		})

		test('file exists', async () => {
			const mock = nock(url)
				.post(filePath, {
					'content': content,
					'commit_message': `add: ${filename}`,
					//
					...jsonBody
				})
				.reply(400, {
					'message': 'A file with this name already exists'
				})

			const res = await GitLab.createFile(filename, content)
			mock.done()
			expect(res).toBeFalsy()
		})
	})

	describe('updateFile', () => {
		test('update file', async () => {
			const mock = nock(url)
				.put(filePath, {
					'content': content,
					'commit_message': `update: ${filename}`,
					//
					...jsonBody
				})
				.reply(200, {
					'file_path': filename,
					'branch': process.env.GIT_BRANCH
				})

			const res = await GitLab.updateFile(filename, content)
			mock.done()
			expect(res).toBe(filename)
		})

		test('file does not exist', async () => {
			const mock = nock(url)
				.put(filePath, {
					'content': content,
					'commit_message': `update: ${filename}`,
					//
					...jsonBody
				})
				.reply(400, {
					'message': 'A file with this name doesn\'t exist'
				})

			const res = await GitLab.updateFile(filename, content)
			mock.done()
			expect(res).toBeFalsy()
		})
	})

	describe('uploadImage', () => {
		test('valid file', async () => {
			const mock = nock(url)
				.post(filePath, {
					'encoding': 'base64',
					'content': b64,
					'commit_message': `upload: ${filename}`,
					//
					...jsonBody
				})
				.reply(200, {
					'file_path': filename,
					'branch': process.env.GIT_BRANCH
				})

			const res = await GitLab.uploadImage(filename, {
				content: content
			})
			mock.done()
			expect(res).toBe(filename)
		})
	})

	describe('getFile', () => {
		test('file exists', async () => {
			const mock = nock(url)
				.get(`${filesAPI}?${branch}&path=${encodeURIComponent(filename)}`)
				.reply(200, content)

			const res = await GitLab.getFile(filename)
			mock.done()
			expect(res).toHaveProperty('filename', filename)
			expect(res).toHaveProperty('content', content)
		})

		test('file does not exists', async () => {
			const mock = nock(url)
				.get(`${filesAPI}?${branch}&path=${encodeURIComponent(filename)}`)
				.reply(404)

			const res = await GitLab.getFile(filename)
			mock.done()
			expect(res).toBeFalsy()
		})
	})

	describe('getDirectory', () => {
		const dir = 'src'
		const item = {
			'id': 'a1e8f8d745cc87e3a9248358d9352bb7f9a0aeba',
			'name': 'html',
			'type': 'tree',
			'path': 'files/html',
			'mode': '040000'
		}

		test('directory exists', async () => {
			const mock = nock(url)
				.get(`${treeAPI}?${branch}&path=${encodeURIComponent(dir)}`)
				.reply(200, [ item, item, item ])

			const res = await GitLab.getDirectory(dir)
			mock.done()
			expect(res).toHaveProperty('files')
			expect(res.files).toHaveLength(3)
		})

		test('directory does not exists', async () => {
			const mock = nock(url)
				.get(`${treeAPI}?${branch}&path=${encodeURIComponent(dir)}`)
				.reply(404)

			const res = await GitLab.getDirectory(dir)
			mock.done()
			expect(res).toBeFalsy()
		})
	})

	describe('deleteFile', () => {
		test('file exists', async () => {
			const mock = nock(url)
				.delete(filePath, {
					'commit_message': `delete: ${filename}`,
					//
					...jsonBody
				})
				.reply(204)

			const res = await GitLab.deleteFile(filename, file)
			mock.done()
			expect(res).toBeTruthy()
			expect(res).toBe(filename)
		})

		test('file does not exists', async () => {
			const mock = nock(url)
				.delete(`${filesAPI}${encodeURIComponent(filename)}`, {
					'commit_message': `delete: ${filename}`,
					//
					...jsonBody
				})
				.reply(400)

			const res = await GitLab.deleteFile(filename, file)
			mock.done()
			expect(res).toBeFalsy()
		})
	})
})
