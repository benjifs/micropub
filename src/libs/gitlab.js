
import got from 'got'

import { Base64 } from './utils'

const DEFAULT_IMAGE_DIR = 'uploads'

const GitLab = {
	createFile: async (filename, content) => {
		console.log('GITLAB.createFile', content)
		return await GitLab.upload('POST', filename, {
			content: content,
			commit_message: `add: ${filename}`
		})
	},

	updateFile: async (filename, content) => {
		console.log('GITLAB.updateFile', content)
		return await GitLab.upload('PUT', filename, {
			content: content,
			commit_message: `update: ${filename}`
		})
	},

	uploadImage: async (file) => {
		console.log('GITLAB.uploadImage', file.filename)
		const dir = (process.env.IMAGE_DIR || DEFAULT_IMAGE_DIR).replace(/\/$/, '')
		const filename = `${dir}/${Math.round(new Date() / 1000)}_${file.filename}`
		return await GitLab.upload('POST', filename, {
			encoding: 'base64',
			content: Base64.encode(file.content),
			commit_message: `upload: ${filename}`
		})
	},

	upload: async (method, filename, jsonBody) => {
		filename = encodeURIComponent(filename)
		const body = await GitLab.request(method, filename, jsonBody)
		if (body && body.file_path) {
			return filename
		}
	},

	getFile: async (filename) => {
		const body = await GitLab.request('GET',
			`${encodeURIComponent(filename)}/raw?ref=${process.env.GIT_BRANCH}`
		)
		if (body) {
			return {
				'filename': filename,
				'content': body
			}
		}
	},

	deleteFile: async (filename) => {
		const body = await GitLab.request('DELETE',
			encodeURIComponent(filename),
			{
				commit_message: `delete: ${filename}`
			}
		)
		if (body) {
			return filename
		}
	},

	request: async (method, endpoint, json) => {
		console.log(`GITLAB.${method}`, endpoint)
		if (process.env.DEBUG && method != 'GET') {
			console.log('-- DEBUGGING')
			return {
				'debugging': true,
				'file_path': true
			}
		}
		const instance = got.extend({
			prefixUrl: `https://gitlab.com/api/v4/projects/${process.env.GITLAB_PROJECT_ID}/repository/files/`,
			headers: {
				'PRIVATE-TOKEN': process.env.GIT_TOKEN
			},
			responseType: method != 'GET' ? 'json' : undefined
		})

		const options = {
			method: method.toUpperCase(),
		}
		if (json) {
			options['Content-Type'] = 'application/json'
			json.branch = process.env.GIT_BRANCH // Branch is required in GitLab
			if (process.env.AUTHOR_EMAIL && process.env.AUTHOR_NAME) { // Optional
				json.author_email = process.env.AUTHOR_EMAIL
				json.author_name = process.env.AUTHOR_NAME
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

export default GitLab
