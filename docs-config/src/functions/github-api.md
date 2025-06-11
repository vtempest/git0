[Documentation](modules.md) / github-api

## default

Defined in: [src/github-api.js:17](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L17)

GitHub API client for downloading repositories, searching, and managing releases
 GithubAPI

### Example

```ts
const github = new GithubAPI();
const repos = await github.searchRepositories('nodejs');
await github.downloadRepo('user/repo', './my-downloads');
```

### Constructors

#### Constructor

```ts
new default(options?: object): default;
```

Defined in: [src/github-api.js:36](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L36)

Creates a new GithubAPI instance

##### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`options?`

</td>
<td>

\{ `baseURL?`: `string`; `debug?`: `boolean`; `token?`: `string`; \}

</td>
<td>

Configuration options

</td>
</tr>
<tr>
<td>

`options.baseURL?`

</td>
<td>

`string`

</td>
<td>

GitHub API base URL

</td>
</tr>
<tr>
<td>

`options.debug?`

</td>
<td>

`boolean`

</td>
<td>

Enable debug logging

</td>
</tr>
<tr>
<td>

`options.token?`

</td>
<td>

`string`

</td>
<td>

GitHub personal access token (defaults to GITHUB_TOKEN env var)

</td>
</tr>
</tbody>
</table>

##### Returns

[`default`](#default)

##### Example

```ts
// Use default settings with environment token

// Use custom token
const github = new GithubAPI({ token: 'ghp_xxxxxxxxxxxx' });

// Enable debug mode
const github = new GithubAPI({ debug: true });
```

### Properties

#### baseURL

```ts
baseURL: string;
```

Defined in: [src/github-api.js:39](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L39)

#### client()

```ts
client: (path: any, options?: object) => Promise<{
[key: string]: unknown;
}>;
```

Defined in: [src/github-api.js:41](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L41)

##### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`path`

</td>
<td>

`any`

</td>
</tr>
<tr>
<td>

`options?`

</td>
<td>

\{ \}

</td>
</tr>
</tbody>
</table>

##### Returns

`Promise`&lt;\{
[`key`: `string`]: `unknown`;
\}&gt;

#### debug

```ts
debug: boolean;
```

Defined in: [src/github-api.js:38](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L38)

#### token

```ts
token: string;
```

Defined in: [src/github-api.js:37](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L37)

#### DEFAULT\_RESULTS\_PER\_PAGE

```ts
static DEFAULT_RESULTS_PER_PAGE: number = 10;
```

Defined in: [src/github-api.js:19](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L19)

##### Constant

Number of results to return per page for repository searches

### Methods

#### downloadPackage()

```ts
downloadPackage(packageURL: any, downloadPath: string): Promise<string>;
```

Defined in: [src/github-api.js:188](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L188)

Downloads a release asset from GitHub and provides installation instructions

##### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`packageURL`

</td>
<td>

`any`

</td>
<td>

Download URL for the asset

</td>
</tr>
<tr>
<td>

`downloadPath`

</td>
<td>

`string`

</td>
<td>

Directory to download the asset to

</td>
</tr>
</tbody>
</table>

##### Returns

`Promise`&lt;`string`&gt;

Path to the downloaded file

##### Throws

When download fails

##### Example

```ts
const asset = 'https://github.com/user/repo/releases/download/v1.0.0/myapp-v1.0.0-linux-x64'
const downloadPath = await github.downloadPackage(asset, './downloads/myapp');
```

#### downloadRepo()

```ts
downloadRepo(repo: string, targetDir?: string): Promise<string>;
```

Defined in: [src/github-api.js:69](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L69)

Downloads a GitHub repository as a tarball and extracts it to a local directory

##### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Default value</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`repo`

</td>
<td>

`string`

</td>
<td>

`undefined`

</td>
<td>

Repository URL or owner/name format

</td>
</tr>
<tr>
<td>

`targetDir?`

</td>
<td>

`string`

</td>
<td>

`null`

</td>
<td>

Target directory name (defaults to repo name)

</td>
</tr>
</tbody>
</table>

##### Returns

`Promise`&lt;`string`&gt;

Path to the extracted repository directory

##### Throws

When repository download fails

##### Example

```ts
// Download repository to current directory
const repoPath = await github.downloadRepo('https://github.com/user/repo');

// Download to specific directory
const repoPath = await github.downloadRepo('user/repo', 'my-custom-dir');
```

#### getCompatibleReleases()

```ts
getCompatibleReleases(owner: string, repo: string): Promise<any[]>;
```

Defined in: [src/github-api.js:310](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L310)

Gets releases compatible with the current platform

##### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`owner`

</td>
<td>

`string`

</td>
<td>

Repository owner

</td>
</tr>
<tr>
<td>

`repo`

</td>
<td>

`string`

</td>
<td>

Repository name

</td>
</tr>
</tbody>
</table>

##### Returns

`Promise`&lt;`any`[]&gt;

Array of compatible releases

##### Example

```ts
const compatible = await github.getCompatibleReleases('user', 'repo');
console.log(`Found ${compatible.length} compatible releases`);
```

#### getCurrentPlatform()

```ts
getCurrentPlatform(): any;
```

Defined in: [src/github-api.js:262](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L262)

Detects the current operating system and architecture

##### Returns

`any`

Platform information object

##### Example

```ts
const platform = github.getCurrentPlatform();
console.log(`Running on ${platform.os} ${platform.arch}`);
```

#### getReleases()

```ts
getReleases(owner: string, repo: string): Promise<any[]>;
```

Defined in: [src/github-api.js:296](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L296)

Gets repository releases with platform categorization

##### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`owner`

</td>
<td>

`string`

</td>
<td>

Repository owner

</td>
</tr>
<tr>
<td>

`repo`

</td>
<td>

`string`

</td>
<td>

Repository name

</td>
</tr>
</tbody>
</table>

##### Returns

`Promise`&lt;`any`[]&gt;

Array of categorized releases

##### Example

```ts
const releases = await github.getReleases('microsoft', 'vscode');
console.log(`Found ${releases.length} releases`);
```

#### parseURL()

```ts
parseURL(query: string): any;
```

Defined in: [src/github-api.js:241](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L241)

Parses a GitHub URL or shorthand repository reference

##### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`query`

</td>
<td>

`string`

</td>
<td>

GitHub URL or owner/repo format

</td>
</tr>
</tbody>
</table>

##### Returns

`any`

Parsed git URL object or false if invalid

##### Example

```ts
// Parse full URL
const parsed = github.parseURL('https://github.com/user/repo');

// Parse shorthand
const parsed = github.parseURL('user/repo');

if (parsed) {
  console.log(`Owner: ${parsed.owner}, Name: ${parsed.name}`);
}
```

#### searchRepositories()

```ts
searchRepositories(query: string, options?: object): Promise<any[]>;
```

Defined in: [src/github-api.js:130](https://github.com/vtempest/git0/blob/a8fc7e45afbaefca0c4e19627a1fa2d11f80f7e6/src/github-api.js#L130)

Searches for GitHub repositories by name and enriches results with release information

##### Parameters

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Type</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>

`query`

</td>
<td>

`string`

</td>
<td>

Search query for repository names

</td>
</tr>
<tr>
<td>

`options?`

</td>
<td>

\{ `order?`: `string`; `perPage?`: `number`; `sort?`: `string`; \}

</td>
<td>

Search options

</td>
</tr>
<tr>
<td>

`options.order?`

</td>
<td>

`string`

</td>
<td>

Sort order (asc, desc)

</td>
</tr>
<tr>
<td>

`options.perPage?`

</td>
<td>

`number`

</td>
<td>

Number of results per page (defaults to DEFAULT_RESULTS_PER_PAGE)

</td>
</tr>
<tr>
<td>

`options.sort?`

</td>
<td>

`string`

</td>
<td>

Sort field (stars, forks, updated)

</td>
</tr>
</tbody>
</table>

##### Returns

`Promise`&lt;`any`[]&gt;

Array of repository objects with release information

##### Throws

When search fails

##### Example

```ts
const repos = await github.searchRepositories('nodejs');
repos.forEach(repo => {
  console.log(`${repo.name}: ${repo.hasReleases ? 'Has releases' : 'No releases'}`);
});

// Custom search options
const repos = await github.searchRepositories('react', {
  perPage: 5,
  sort: 'updated',
  order: 'desc'
});
```
