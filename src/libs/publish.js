
import GitHub from './github'
import content from './content'
import parse from './parse'
import { utils } from './utils'

// If empty -> return empty array
// If array -> return full array
// else -> return array of single item
const getFile = file => {
	return !file ? [] : (Array.isArray(file) ? file : [file])
}

const uploadFiles = async data => {
	if (!data) {
		return []
	}
	let files = [], uploaded = []
	files = files.concat(getFile(data.photo))
	files = files.concat(getFile(data.file))
	files = files.concat(getFile(data['photo[]']))
	files = files.concat(getFile(data['file[]']))
	for (let i in files) {
		let upload
		if (files[i].filename) {
			const tmp = await GitHub.uploadImage(files[i])
			if (tmp) {
				upload = { 'value': tmp }
			}
		} else if (files[i].alt || files[i].value) {
			upload = files[i]
		} else {
			upload = { 'value': files[i] }
		}
		upload && uploaded.push(upload)
	}
	return uploaded
}

export default {
	addContent: async (data, json) => {
		const uploaded = await uploadFiles(data)
		if (uploaded && uploaded.length) {
			for (let i in uploaded) {
				const { alt, value } = uploaded[i]
				if (value) {
					data.content = `![${alt || ''}](/${value})\n\n${data.content}`
				}
			}
		}
		const parsed = json ? parse.fromJSON(data) : parse.fromForm(data)
		console.log('└─>', parsed)
		if (!parsed || !parsed.content) {
			return { 'error': 'content is empty' }
		}
		const out = content.format(parsed)
		if (!out || !out.filename || !out.formatted) {
			return { 'error': 'could not parse data' }
		}
		const exists = await GitHub.getFile(out.filename)
		if (exists) {
			return { 'error': 'file exists' }
		}
		const filename = await GitHub.createFile(out.filename, out.formatted)
		if (filename) {
			return { 'filename': out.slug }
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
		let parsed = parse.fromFrontMatter(exists.content)
		if (!parsed) {
			return { 'error': 'could not parse file' }
		}
		if (!body.replace || !body.replace.content) {
			return { 'error': 'nothing  to update' }
		}
		const replace = utils.removeEmpty(parse.fromJSON({
			'type': parsed.type,
			'properties': body.replace
		}))
		// Merge properties from `replace` into `parsed`
		parsed = { ...parsed, ...replace }

		const out = content.format(parsed)
		if (!out || !out.filename || !out.formatted) {
			return { 'error': 'could not parse data' }
		}
		const res = await GitHub.updateFile(filename, out.formatted, exists)
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
