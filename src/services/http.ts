import { Chunk, Progress } from '../models';

export class HttpClient {
	private options: HttpClientOptions;
	private xhr: XMLHttpRequest;

	onProgress: (progress: Chunk) => void;
	onComplete: (progress: Progress) => void;
	onError: (err: Error) => void;

	constructor(options?: HttpClientOptions) {
		this.onProgress = () => {};
		this.onComplete = () => {};
		this.onError = () => {};
		this.options = Object.assign({ chunkByteLimit: 3145728 }, options);
		const xhr = new (XMLHttpRequest as any)({
			mozSystem: true
		});
		xhr.responseType = 'moz-chunked-arraybuffer';
		this.xhr = xhr;
	}

	download(url: string): void {
		let chunk = {
			part: 1,
			startBytes: 0,
			endBytes: 0,
			bytes: 0,
			totalBytes: 0,
			data: new ArrayBuffer(0)
		};
		let savedBytes = 0;
		this.xhr.addEventListener('progress', (ev) => {
			const responseLength = this.xhr.response.byteLength;
			chunk.totalBytes = ev.total;
			let availableBytes = responseLength;
			while (availableBytes > 0) {
				const bytesNeeded = this.options.chunkByteLimit - chunk.data.byteLength;
				const bytesBefore = chunk.data.byteLength;
				chunk.data = this.appendChunk(
					chunk.data,
					this.xhr.response.slice(
						responseLength - availableBytes,
						responseLength - availableBytes + bytesNeeded
					)
				);
				chunk.bytes = chunk.data.byteLength;
				chunk.endBytes = chunk.startBytes + chunk.data.byteLength;
				availableBytes = availableBytes - (chunk.data.byteLength - bytesBefore);
				if (chunk.data.byteLength >= this.options.chunkByteLimit || ev.total === ev.loaded) {
					savedBytes = savedBytes + chunk.data.byteLength;
					this.onProgress({ ...chunk });
					chunk = {
						part: chunk.part + 1,
						startBytes: chunk.endBytes,
						endBytes: chunk.endBytes,
						bytes: 0,
						totalBytes: ev.total,
						data: new ArrayBuffer(0)
					};
				}
			}
		});
		// this.xhr.addEventListener('load', () =>
		// 	this.onComplete?.({
		// 		currentBytes: chunk.endBytes,
		// 		totalBytes: chunk.totalBytes
		// 	})
		// );
		this.xhr.addEventListener('abort', () => console.log(`Download aborted`));
		this.xhr.addEventListener('error', () => this.onError?.(new Error('File download failed')));
		this.xhr.open('GET', url, true);
		this.xhr.send();
	}

	abort(): void {
		this.xhr.abort();
	}

	private appendChunk(source: ArrayBuffer, newData: ArrayBuffer) {
		if (!newData) {
			return source;
		}
		const tmp = new Uint8Array(source.byteLength + newData.byteLength);
		tmp.set(new Uint8Array(source), 0);
		tmp.set(new Uint8Array(newData), source.byteLength);
		return tmp.buffer;
	}
}

type HttpClientOptions = {
	chunkByteLimit: number;
};
