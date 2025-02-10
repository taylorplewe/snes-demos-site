window.Module = {
	print: text => console.log(text),
	printErr: text => console.error(text),
	canvas: (() => {
		const canvas = document.querySelector('#snesCanvas');
		canvas.addEventListener('webglcontextlost', function(e) {
			alert('WebGL context lost. You will need to reload the page.');
			e.preventDefault();
		}, false);
		const context = canvas.getContext('2d');
		context.imageSmoothingEnabled = false;
		return canvas;
	})(),
	setStatus: text => console.log('status:', text),
	totalDependencies: 0,
	monitorRunDependencies: function(left) {
		this.totalDependencies = Math.max(this.totalDependencies, left);
		Module.setStatus(left ?
			'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' :
			'All downloads complete.'
		);
	}
};

Module.setStatus('Downloading...');
window.onerror = () => {
	Module.setStatus('Exception thrown, see JavaScript console');
	Module.setStatus = text => text && Module.printErr('[post-exception status] ' + text);
};

window.initSNES = () => {
	let filename;
	const cout_print = Module.print;
	const snesReadFile = evt => {
		const f = evt.currentTarget.files[0];
		cout_print(f.name);
		filename = f.name;
		const reader = new FileReader();
		reader.onprogress = function(e) {
			if (e.lengthComputable)
				cout_print(Math.round((e.loaded / e.total) * 100) + '%');
			else
				count_print(e.loaded + 'bytes');
		};
		reader.onload = function(e) {
			cout_print(f.name + ' loaded');
			Module.FS_createDataFile('/', f.name, new Uint8Array(this.result) , true, true);
		};
		reader.readAsArrayBuffer(f);
		setTimeout(snesMain, 1_000);
	};
	const fileInput = document.querySelector('#snesFile');
	fileInput.addEventListener('change', snesReadFile);

	const run = Module.cwrap('run', null, ['string']);
	const snesMain = () => {
		run(filename);
	}

	window.addEventListener('beforeunload', Module._S9xAutoSaveSRAM);
};
