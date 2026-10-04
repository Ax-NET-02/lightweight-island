import { ref } from 'vue'
import localDefaultAvatar from '@/assets/default-avatar.png'
import { db, type RecordItem, type UserProfile } from '@/db/db'

export type { RecordItem, UserProfile }

export const DEFAULT_AVATAR = localDefaultAvatar

export const globalProfile = ref<UserProfile>({
  name: '',
  age: '',
  signature: '',
  height: '',
  initialWeight: '',
  goalWeight: '',
  avatar: ''
})

// 初始化并获取个人资料
export const getProfile = async () => {
  const profile = await db.profile.get(1)
  if (profile) {
    globalProfile.value = profile
  } else {
    await db.profile.put({ ...globalProfile.value, id: 1 })
  }
  return globalProfile.value
}

// 保存个人资料
export const saveProfileData = async (updatedData: UserProfile) => {
  const dataToSave = { ...updatedData, id: 1 }
  await db.profile.put(dataToSave)
  globalProfile.value = dataToSave
}

// 重置/清除个人资料
export const resetProfileData = async () => {
  const blankProfile: UserProfile = {
    name: '轻盈岛民',
    age: '',
    signature: '开启全新的轻盈之旅',
    height: '',
    initialWeight: '',
    goalWeight: '',
    avatar: ''
  }
  await db.profile.put({ ...blankProfile, id: 1 })
  globalProfile.value = blankProfile
}

export const getRecords = async (): Promise<RecordItem[]> => {
  const records = await db.records.orderBy('date').reverse().toArray()
  return records
}

// 打卡记录处理
export const getRecordsCount = async (): Promise<number> => {
  return await db.records.count()
}

export const getPagedRecords = async (page: number, pageSize: number): Promise<RecordItem[]> => {
  const offset = (page - 1) * pageSize
  return await db.records.orderBy('date').reverse().offset(offset).limit(pageSize).toArray()
}

export const addRecord = async (record: Omit<RecordItem, 'id'>) => {
  return await db.records.add(record)
}

export const updateRecord = async (updated: RecordItem) => {
  if (!updated.id) return
  return await db.records.put(updated)
}

export const deleteRecord = async (id: number) => {
  return await db.records.delete(id)
}

// 清除所有打卡数据
export const clearAllData = async () => {
  await db.records.clear()
}