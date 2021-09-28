
import GitHub from './github'
import content from './content'
import { utils } from './utils'

export default {
	addContent: async (data, json) => {
		if (data.photo || data.file) {
			const upload = await GitHub.uploadImage(data.file || data.photo)
			if (upload) {
				data.content = `![](/${upload})\n\n${data.content}`
			}
		}
		const formatted = utils.format(json ? utils.parseJSON(data) : data)
		console.log('└─>', formatted)
		if (!formatted.content) {
			return { 'error': 'content is empty' }
		}
		const exists = await GitHub.getFile(formatted.filename)
		if (exists) {
			return { 'error': 'file exists' }
		}
		const filename = await GitHub.createFile(formatted.filename, content.output(formatted))
		if (filename) {
			return { 'filename': formatted.slug }
		}
	},
	updateContent: async (url, body) => {
		const filename = utils.urlToFilename(url)
		if (!filename) {
			return { 'error': 'invalid url' }
		}
		const exists = await GitHub.getFile(filename)
		if (!exists) {
			return { 'error': 'file does not exist' }
		}
		const parsed = content.parse(exists.content)
		if (!parsed) {
			return { 'error': 'could not parse file' }
		}
		if (body.replace && body.replace.content) {
			parsed.content = utils.stringFromProp(body.replace.content)
		} else {
			return { 'error': 'nothing  to update' }
		}
		const res = await GitHub.updateFile(filename, content.output(parsed), exists)
		if (!res) {
			return { 'error': 'file cannot be updated'}
		}
		return { 'filename': filename }
	},
	deleteContent: async (url) => {
		const filename = utils.urlToFilename(url)
		if (!filename) {
			return { 'error': 'invalid url' }
		}
		const exists = await GitHub.getFile(filename)
		if (!exists) {
			return { 'error': 'file does not exist' }
		}
		const res = await GitHub.deleteFile(filename, exists)
		if (!res) {
			return { 'error': 'file cannot be deleted' }
		}
		return { 'filename': filename }
	}
}
