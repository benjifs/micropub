
import got from 'got'

import { Base64 } from './utils'

const GitHub = {
	createFile: async (filename, content) => {
		console.log('GITHUB.createFile', content)
		return await GitHub.upload('PUT', filename, {
			'content': Base64.encode(content),
			'message': `add: ${filename}`
		})
	},

	updateFile: async (filename, content, original) => {
		console.log('GITHUB.updateFile', content)
		return await GitHub.upload('PUT', filename, {
			'content': Base64.encode(content),
			'sha': original.sha,
			'message': `update: ${filename}`
		})
	},

	uploadImage: async (filename, file) => {
		console.log('GITHUB.uploadImage', filename, file.filename)
		return await GitHub.upload('PUT', filename, {
			'content': Base64.encode(file.content),
			'message': `upload: ${filename}`
		})
	},

	upload: async (method, filename, jsonBody) => {
		const body = await GitHub.request(method, encodeURIComponent(filename), jsonBody)
		if (body && body.content && body.content.path) {
			return filename
		}
	},

	getFile: async (filename) => {
		const body = await GitHub.request('GET',
			encodeURIComponent(filename) + (process.env.GIT_BRANCH ? `?ref=${process.env.GIT_BRANCH}` : '')
		)
		if (body) {
			return {
				'filename': filename,
				'content': Base64.decode(body.content),
				'sha': body.sha
			}
		}
	},

	// https://docs.github.com/en/rest/reference/repos#get-repository-content
	// GitHub Contents returns first 1000 files sorted by filename in dir
	// Might need to switch to tree API later
	// https://docs.github.com/en/rest/reference/git#get-a-tree
	getDirectory: async (dir) => {
		const body = await GitHub.request('GET',
			encodeURIComponent(dir) + (process.env.GIT_BRANCH ? `?ref=${process.env.GIT_BRANCH}` : '')
		)
		if (body && Array.isArray(body)) {
			return { 'files': body }
		}
	},

	deleteFile: async (filename, original) => {
		const body = await GitHub.request('DELETE',
			encodeURIComponent(filename),
			{
				'sha': original.sha,
				'message': `delete: ${filename}`
			}
		)
		if (body) {
			return filename
		}
	},

	request: async (method, endpoint, json) => {
		console.log(`GITHUB.${method}`, endpoint)
		if (process.env.DEBUG && method != 'GET') {
			console.log('-- DEBUGGING')
			return {
				'debugging': true,
				'content': {
					'path': true
				}
			}
		}
		const instance = got.extend({
			prefixUrl: `https://api.github.com/repos/${process.env.GITHUB_USER}/${process.env.GITHUB_REPO}/contents/`,
			headers: {
				'accept': 'application/vnd.github.v3+json',
				'authorization': `Bearer ${process.env.GIT_TOKEN}`
			},
			responseType: 'json'
		})

		const options = {
			method: method.toUpperCase(),
		}
		if (json) {
			options['Content-Type'] = 'application/json'
			if (process.env.GIT_BRANCH) {
				json['branch'] = process.env.GIT_BRANCH
			}
			if (process.env.AUTHOR_EMAIL && process.env.AUTHOR_NAME) {
				json['committer'] = {
					'email': process.env.AUTHOR_EMAIL,
					'name': process.env.AUTHOR_NAME
				}
			}
			options['json'] = json
		}
		try {
			const { body } = await instance(endpoint, options)
			console.log('└─>', body)
			return method == 'GET' ? body : {
				'success': true,
				...body
			}
		} catch (err) {
			const { response } = err
			console.error('ERROR', response.statusCode, response.body)
		}
	}
}

export default GitHub
