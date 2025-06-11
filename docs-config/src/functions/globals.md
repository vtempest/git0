## installDependencies()

```ts
function installDependencies(targetDir: string): Promise<void>;
```

Defined in: git0.js:208

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

Defined in: git0.js:158

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
