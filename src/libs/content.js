
import { utils } from './utils'

const DEFAULT_CONTENT_DIR = 'src'

const content = {
	output: data => {
		if (!data) {
			return null
		}
		return '---\n' +
			`date: ${data.date}\n` +
			(data.name ? `title: ${data.name}\n` : '') +
			(data.category ? `tags:\n - ${data.category.join('\n - ')}\n` : '') +
			(data.deleted ? 'deleted: true\n' : '') +
			(data.draft ? 'draft: true\n' : '') +
			(data.updated ? `updated: ${data.updated}\n` : '') +
			'---\n\n' +
			data.content
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
		const type = data.name ? 'posts' : 'notes'
		let slug
		if (data.slug) {
			slug = `${type}/${utils.slugify(slug)}`
		} else {
			const ts = Math.round(date / 1000)
			slug = `${type}/${ts}` + (data.name ? `-${utils.slugify(data.name)}` : '')
		}
		const dir = (process.env.CONTENT_DIR || DEFAULT_CONTENT_DIR).replace(/\/$/, '')
		const filename = `${dir}/${slug}.md`

		return {
			'filename': filename,
			'slug': slug,
			'formatted': content.output(data),
			'data': data
		}
	}
}

export default content
