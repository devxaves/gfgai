import Dexie, { type Table } from 'dexie';

export class LocalDatabase extends Dexie {
  uploads!: Table<any, number>;

  constructor() {
    super('InsightAIDatabase');
    // Define the schema: id is auto-incremented primary key, 
    // we also index any keys we might filter on, 
    // but initially we just store the generic object.
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
}

const db = new LocalDatabase();

export default db;
