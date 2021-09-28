
<a href="https://app.netlify.com/start/deploy?repository=https://github.com/benjifs/micropub"><img src="https://www.netlify.com/img/deploy/button.svg"></a>

## Original repo

[GitLab benjifs/micropub](https://gitlab.com/benjifs/micropub)

Serverless [Micropub](https://indieweb.org/Micropub) server that accepts `CREATE`, `UPDATE`, and `DELETE` requests and adds or removes the corresponding files to a repository where your static site lives ([Eleventy](https://www.11ty.dev/), [Hugo](https://gohugo.io/), etc.)

## Usage

* Deploy to [Netlify](https://www.netlify.com/)
* Create a [GitHub Personal Access Token](https://github.com/settings/tokens)
* Set the required [Environment Variables](#environment-variables)
* Configure your site with the [Micropub endpoint](https://indieweb.org/Micropub#Endpoint_Discovery)
```
<link rel="micropub" href="https://example.com/micropub">
```
* Use a [Micropub Client](https://indieweb.org/Micropub/Clients) to authenticate and post to your site.

### GitLab

If your static site's repository is on [GitLab](https://gitlab.com), fork this repo instead and change the imports in [src/media.js](src/media.js) and [src/libs/publish.js](src/libs/publish.js) to `gitlab`.

Alternatively, the [GitLab repo](https://gitlab.com/benjifs/micropub) can also be deployed and it should be setup to run with a GitLab repository.

## Environment Variables
### Required
| name | description |
| --- | --- |
| GIT_TOKEN | [GitHub Personal Access Token](https://github.com/settings/tokens) *OR* [GitLab Personal Access Token](https://gitlab.com/-/profile/personal_access_tokens) |
| GIT_BRANCH |Branch name to add posts to. Must already exist. **Required for GitLab**, optional for GitHub |
| --- | --- |
| GITHUB_USER | Username for repo where posts are added to |
| GITHUB_REPO | Name of repo where posts are added to |
| --- | --- |
| GITLAB_PROJECT_ID | Project ID for the repo posts are added to |
| --- | --- |
| ME | `rel="me"` |
| TOKEN_ENDPOINT | Endpoint to validate Token |

### Optional
| name | description | default |
| --- | --- | --- |
| GIT_AUTHOR_EMAIL | Author email for commits | `GIT_TOKEN` owner's email |
| GIT_AUTHOR_NAME | Author name for commits | `GIT_TOKEN` owner's name |
| --- | --- | --- |
| MEDIA_ENDPOINT | If using an external `MEDIA_ENDPOINT`. Returned in [configuration](https://micropub.spec.indieweb.org/#configuration) | `NETLIFY_URL/.netlify/functions/media` |
| CONTENT_DIR | Directory where posts are uploaded to | `src` |
| IMAGE_DIR | Directory where media is uploaded to | `uploads` |

### Additional Environment Variables
* `DEBUG`: Will prevent `POST`, `PUT`, and `DELETE` requests to go to GitHub or GitLab. Only used for debugging.

## Scopes
* create - allows the client to create posts on behalf of the user
* update - allows the client to edit existing posts
* delete - allows the client to delete posts
* media - allows the client to upload files to the media endpoint

## Troubleshooting
* `GIT_BRANCH` should already exist
* `ME` should have a trailing slash

## TODO
* Add tests
* Separate the GitHub and GitLab functions (maybe as their own npm packages)
* Configure to run with either GitHub or GitLab based on the set environment variables

## References
### Micropublish
* https://micropublish.net/new/h-entry/note

### Indieweb
* https://indieweb.org/Micropub#Handling_a_micropub_request
* https://micropub.spec.indieweb.org/#error-response
* https://indieweb.org/Micropub-extensions

### GitHub
* https://docs.github.com/en/rest/reference/repos

### GitLab
* https://docs.gitlab.com/ee/api/repository_files.html
