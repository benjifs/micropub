
import GitHub from './github'
import content from './content'
import parse from './parse'
import { utils } from './utils'

const uploadFiles = async files => {
	const photos = []
	for (let file of files) {
		if (file.filename) {
			const uploaded = await GitHub.uploadImage(file)
			if (uploaded) {
				photos.push({ 'value': uploaded })
			}
		} else if (file.alt || file.value) {
			photos.push(file)
		} else {
			photos.push({ 'value': file })
		}
	}
	return photos
}

const handleUpdate = (body, parsed) => {
	if (!body && !body.replace && !body.add && !body.delete) {
		return
	}
	const updates = utils.removeEmpty(parse.fromJSON({
		'type': parsed.type,
		'properties': body.replace || body.add || body.delete
	}))
	if (!updates || Object.entries(updates).length <= 1) { // `updates` always has property 'type'
		return
	}
	if (body.replace) {
		return { ...parsed, ...updates }
	} else if (body.delete && Array.isArray(body.delete)) {
		for (let key of body.delete) {
			delete parsed[key]
		}
		return parsed
	} else {
		for (let [key, value] of Object.entries(updates)) {
			if (key == 'type' || key == 'photo') { // skip these properties
				continue
			}
			if (body.add) {
				parsed[key] = parsed[key] || []
				parsed[key] = [ ...parsed[key], ...updates[key] ]
			} else if (body.delete && parsed[key] && Array.isArray(parsed[key])) {
				// Only deletes here if the original value was an array
				// Look for the specific item to delete from a potential list of values
				for (let item of value) {
					// Remove `item` from `parsed[key]` if it exists
					if (parsed[key].includes(item)) {
						parsed[key].splice(parsed[key].indexOf(item), 1)
					}
				}
			}
		}
		return parsed
	}
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
			for (let img of uploaded) {
				if (img.value) {
					imageContent += `![${img.alt || ''}](/${img.value})\n\n`
				}
			}
			parsed.content = `${imageContent}${parsed.content}`
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
		const updated = handleUpdate(body, parsed)
		if (!updated) {
			return { 'error': 'nothing to update' }
		}
		const out = content.format(updated)
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
