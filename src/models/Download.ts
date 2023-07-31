import { Status } from '../enums';

export type Download = {
	id: number;
	episodeId: number;
	episodeTitle: string;
	podcastTitle: string;
	remoteFileUrl: string;
	localFileUrl: string;
	currentBytes: number;
	totalBytes: number;
	status: Status;
};
