[Documentation](modules.md) / git0

## installDependencies()

```ts
function installDependencies(targetDir: string): Promise<void>;
```

Defined in: [src/git0.js:208](https://github.com/vtempest/git0/blob/a96db11cbcc85bdaa38db2e55b091a88c5cb44e5/src/git0.js#L208)

Automatically detects project type and installs dependencies
Supports Node.js, Docker, Python, Rust, and Go projects

### Parameters

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

`targetDir`

</td>
<td>

`string`

</td>
<td>

Path to the project directory

</td>
</tr>
</tbody>
</table>

### Returns

`Promise`&lt;`void`&gt;

### Export

### Async

***

## openInIDE()

```ts
function openInIDE(targetDir: string): void;
```

Defined in: [src/git0.js:158](https://github.com/vtempest/git0/blob/a96db11cbcc85bdaa38db2e55b091a88c5cb44e5/src/git0.js#L158)

Opens a directory in the first available IDE/editor
Also attempts to open a README or package.json file after 3 seconds

### Parameters

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

`targetDir`

</td>
<td>

`string`

</td>
<td>

Path to the directory to open

</td>
</tr>
</tbody>
</table>

### Returns

`void`

### Export
