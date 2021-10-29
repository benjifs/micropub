
import { utils } from './utils'

const content = {
	output: data => {
		if (!data) {
			return null
		}
		return '---\n' +
			`date: ${data.date}\n` +
			(data.name ? `title: "${data.name}"\n` : '') +
			(data.category && data.category.length ? `tags:\n - ${data.category.join('\n - ')}\n` : '') +
			(data.draft ? 'draft: true\n' : '') +
			(data.updated ? `updated: ${data.updated}\n` : '') +
			(data['like-of'] ? `like-of: ${data['like-of']}\n` : '') +
			(data['bookmark-of'] ? `bookmark-of: ${data['bookmark-of']}\n` : '') +
			(data['in-reply-to'] ? `in-reply-to: ${data['in-reply-to']}\n` : '') +
			(data['rsvp'] ? `rsvp: ${data['rsvp']}\n` : '') +
			(data['deleted'] ? 'deleted: true\n' : '') +
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
			return 'posts'
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
