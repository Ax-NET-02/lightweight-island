import Dexie, { type Table } from 'dexie'

// 打卡
export interface RecordItem {
  id?: number
  userName: string
  date: string
  weight: number
  diary: string
  imageUrl: string
}

// 个人资料
export interface UserProfile {
  id?: number
  avatar: string
  name: string
  signature: string
  age: string
  height: string
  initialWeight: string
  goalWeight: string
}

export class IslandDatabase extends Dexie {
  records!: Table<RecordItem, number>
  profile!: Table<UserProfile, number>

  constructor() {
    super('LightweightIslandDB')
    this.version(2).stores({
      records: '++id, date, weight',
      profile: '++id'
    })
  }
}

export const db = new IslandDatabase()