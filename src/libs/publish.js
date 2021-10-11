
import GitHub from './github'
import content from './content'
import parse from './parse'
import { utils } from './utils'

const uploadFiles = async files => {
	const photos = []
	for (let i in files) {
		if (files[i].filename) {
			const uploaded = await GitHub.uploadImage(files[i])
			if (uploaded) {
				photos.push({ 'value': uploaded })
			}
		} else if (files[i].alt || files[i].value) {
			photos.push(files[i])
		} else {
			photos.push({ 'value': files[i] })
		}
	}
	return photos
}

export default {
	addContent: async (data, isJSON) => {
		const parsed = isJSON ? parse.fromJSON(data) : parse.fromForm(data)
		console.log('└─>', parsed)
		if (!parsed || !parsed.content) {
			return { 'error': 'content is empty' }
		}
		const uploaded = await uploadFiles(parsed.photo)
		if (uploaded && uploaded.length) {
			let imageContent = ''
			for (let i in uploaded) {
				const { alt, value } = uploaded[i]
				if (value) {
					imageContent += `![${alt || ''}](/${value})\n\n`
				}
			}
			parsed.content = `${imageContent}${parsed.content}`
		}
		console.log(parsed.content)
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
