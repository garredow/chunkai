import { StorageName } from './enums';
import { Chunk, Progress } from './models';
import { HttpClient, Storage } from './services';

type Options = {
	storageName: StorageName;
	localFileUrl: string;
	remoteFileUrl: string;
	chunkByteLimit?: number;
};

export class Chunkai {
	private options: Options;
	private httpClient?: HttpClient;
	private chunkQueue: Chunk[];
	private processingChunk: boolean;

	onProgress?: (progress: Progress) => void;
	onComplete?: (progress: Progress) => void;
	onAbort?: () => void;
	onError?: (err: Error) => void;

	constructor(options: Options) {
		this.chunkQueue = [];
		this.processingChunk = false;
		this.options = options;
	}

	async start(): Promise<void> {
		if (this.httpClient) {
			console.log('Already downloading a file');
			return;
		}
		await Storage.delete(this.options.storageName, this.options.localFileUrl);
		await Storage.addNamed(this.options.storageName, new Blob(), this.options.localFileUrl);

		this.httpClient = new HttpClient({
			chunkByteLimit: this.options.chunkByteLimit || 3145728
		});
		this.httpClient.onProgress = (chunk) => {
			this.chunkQueue.push(chunk);
			this.processNextChunk();
		};
		this.httpClient.onError = (err) => this.onError?.(err);
		this.httpClient.download(this.options.remoteFileUrl);
	}

	abort() {
		if (!this.httpClient) return;

		this.httpClient.abort();
		this.onAbort?.();
	}

	private async processNextChunk() {
		if (this.processingChunk) return;

		this.processingChunk = true;
		const chunk = this.chunkQueue[0];
		if (!chunk) {
			this.processingChunk = false;
			return;
		}
		// console.log(
		//   `Process chunk ${chunk.part} (${chunk.endBytes}/${chunk.totalBytes}) (Queue length ${this.chunkQueue.length})`
		// );
		await Storage.appendNamed(
			this.options.storageName,
			new Blob([chunk.data]),
			this.options.localFileUrl
		);

		this.chunkQueue.shift();

		this.onProgress?.({ currentBytes: chunk.endBytes, totalBytes: chunk.totalBytes });

		if (chunk.endBytes === chunk.totalBytes) {
			this.onComplete?.({ currentBytes: chunk.endBytes, totalBytes: chunk.totalBytes });
		} else {
			this.processingChunk = false;
			await this.processNextChunk();
		}
	}
}
