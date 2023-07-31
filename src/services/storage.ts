import { StorageName } from '../enums';

type Request<T> = {
	error?: Error;
	result: T;
	onsuccess: () => void;
	onerror: () => void;
};

type MozNavigator = Navigator & {
	getDeviceStorage: (name: StorageName) => {
		storageName: string;
		get: (filePath: string) => Request<File>;
		addNamed: (file: File | Blob, filePath: string) => Request<File>;
		appendNamed: (file: File | Blob, filePath: string) => Request<File>;
		delete: (filePath: string) => Request<void>;
		enumerate: any;
	};
};

export class Storage {
	private static navigator: MozNavigator = window.navigator as MozNavigator;

	static get(storageName: StorageName, filePath: string): Promise<File> {
		return new Promise((resolve, reject) => {
			const storage = this.navigator.getDeviceStorage(storageName);
			const request = storage.get(filePath);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
	static getAsFileUrl(storageName: StorageName, filePathAndName: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const storage = this.navigator.getDeviceStorage(storageName);
			const request = storage.get(filePathAndName);
			request.onsuccess = () => resolve(URL.createObjectURL(request.result));
			request.onerror = () => reject(request.error);
		});
	}
	static addNamed(
		storageName: StorageName,
		file: Blob | File,
		filePathAndName: string
	): Promise<File> {
		return new Promise((resolve, reject) => {
			const storage = this.navigator.getDeviceStorage(storageName);
			const request = storage.addNamed(file, filePathAndName);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
	static appendNamed(
		storageName: StorageName,
		file: Blob | File,
		filePathAndName: string
	): Promise<File> {
		return new Promise((resolve, reject) => {
			const storage = this.navigator.getDeviceStorage(storageName);
			const request = storage.appendNamed(file, filePathAndName);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
	static delete(storageName: StorageName, filePathAndName: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const storage = this.navigator.getDeviceStorage(storageName);
			const request = storage.delete(filePathAndName);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}
	static getActualStorageName(storageName: StorageName): string {
		return this.navigator.getDeviceStorage(storageName)?.storageName;
	}
}
