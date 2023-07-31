export type Chunk = {
	part: number;
	startBytes: number;
	endBytes: number;
	bytes: number;
	totalBytes: number;
	data: ArrayBuffer;
};
