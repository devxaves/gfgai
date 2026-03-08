import Dexie, { type Table } from 'dexie';

export class LocalDatabase extends Dexie {
  uploads!: Table<any, number>;

  constructor() {
    super('VizlyAIDatabase');
    this.version(1).stores({
      uploads: '++id'
    });
  }

  async uploadData(data: any[]) {
    await this.uploads.clear();
    await this.uploads.bulkAdd(data);
  }

  async getAllData() {
    return await this.uploads.toArray();
  }

  async getRowCount() {
    return await this.uploads.count();
  }

  async getSchema(): Promise<string[]> {
    const data = await this.uploads.limit(1).toArray();
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).filter(k => k !== 'id');
  }

  async clearData() {
    await this.uploads.clear();
  }
}

const db = new LocalDatabase();

export default db;
