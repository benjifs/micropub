
import GitHub from './github'
import content from './content'
import parse from './parse'
import { utils } from './utils'

const uploadFiles = async files => {
	if (!files) {
		return []
	}
	const photos = []
	for (let file of files) {
		if (file.filename) {
			const filename = content.mediaFilename(file)
			const uploaded = await GitHub.uploadImage(filename, file)
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
	let updated = false
	if (!body && !body.replace && !body.add && !body.delete) {
		return
	}
	if (body.delete && Array.isArray(body.delete)) {
		for (let key of body.delete) {
			if (parsed[key]) {
				updated = true
				delete parsed[key]
			}
		}
		return updated ? parsed : null
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
	} else {
		for (let [key, value] of Object.entries(updates)) {
			if (key == 'type' || key == 'photo') { // skip these properties
				continue
			}
			if (body.add) {
				updated = true
				if (parsed[key]) {
					parsed[key] = [ ...parsed[key], ...value ]
				} else {
					parsed[key] = value
				}
			} else if (body.delete && parsed[key] && Array.isArray(parsed[key])) {
				// Only deletes here if the original value was an array
				// Look for the specific item to delete from a potential list of values
				for (let item of value) {
					// Remove `item` from `parsed[key]` if it exists
					if (parsed[key].includes(item)) {
						updated = true
						parsed[key].splice(parsed[key].indexOf(item), 1)
					}
				}
			}
		}
		return updated ? parsed : null
	}
}

const publish = {
	handleUpdate: handleUpdate,

	addContent: async (data, isJSON, clientId) => {
		const parsed = isJSON ? parse.fromJSON(data) : parse.fromForm(data)
		console.log('└─>', parsed)
		if (parsed && parsed['like-of']) {
			parsed.name = parsed.name || await parse.getPageTitle(parsed['like-of'])
		}
		if (parsed && parsed.photo) {
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
		}
		if (!utils.objectHasKeys(parsed)) {
			return { 'error': 'nothing to add' }
		}
		const out = content.format(parsed, clientId)
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
	deleteContent: async (url, permanent) => {
		if (!permanent) {
			return publish.updateContent(url, {
				'add': {
					'deleted': [ 'true' ]
				}
			})
		}
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
	},
	undeleteContent: async (url) => {
		// undelete supported even if `PERMANENT_DELETE` is true
		// but only if file has the property `deleted`
		return publish.updateContent(url, {
			'delete': [ 'deleted' ]
		})
	}
}

export default publish
