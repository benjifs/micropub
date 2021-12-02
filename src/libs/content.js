
import { utils } from './utils'

const renameProperties = {
	'name': 'title',
	'category': 'tags'
}

const ignoreProperties = [
	'content', 'photo'
]

const content = {
	output: data => {
		if (!data) {
			return null
		}

		let fm = ''
		for (let [key, value] of Object.entries(data)) {
			if (ignoreProperties.includes(key)) {
				continue
			}
			if (renameProperties[key]) {
				key = renameProperties[key]
			}
			if (key == 'tags' && value && value.length) {
				fm += `${key}:\n - ${value.join('\n - ')}\n`
			} else if (key == 'title') { // Always force title to have double quotes
				fm += `${key}: "${value}"\n`
			} else {
				fm += `${key}: ${value}\n`
			}
		}

		return '---\n' +
			fm +
			'---\n\n' +
			`${data.content || ''}`
	},

	format: data => {
		if (!data) {
			return null
		}
		const date = new Date()
		if (!data.date) {
			data.date = date.toISOString()
		} else {
			data.updated = date.toISOString()
		}
		const type = content.getType(data) || ''
		let slug
		if (data.slug) {
			slug = `${type}/${utils.slugify(data.slug)}`
		} else {
			const ts = Math.round(date / 1000)
			slug = `${type}/${ts}` + (data.name ? `-${utils.slugify(data.name)}` : '')
		}
		const dir = (process.env.CONTENT_DIR || 'src').replace(/\/$/, '')
		const filename = `${dir}/${slug}.md`

		return {
			'filename': filename,
			'slug': slug,
			'formatted': content.output(data),
			'data': data
		}
	},

	getType: data => {
		if (!data || typeof data !== 'object' || !Object.keys(data).length) {
			return null
		}
		if (data['like-of']) {
			return 'likes'
		}
		if (data['bookmark-of']) {
			return 'bookmarks'
		}
		if (data['rsvp'] && data['in-reply-to']) {
			return 'rsvp'
		}
		if (data['name']) {
			return 'articles'
		}
		return 'notes'
	},

	mediaFilename: file => {
		if (file && file.filename) {
			let dir = (process.env.MEDIA_DIR || 'uploads').replace(/\/$/, '')
			return `${dir}/${Math.round(new Date() / 1000)}_${file.filename}`
		}
	}
}

export default content
