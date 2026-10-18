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
  avatar: '',
  unit: 'kg'
})

// 初始化并获取个人资料
export const getProfile = async () => {
  const profile = await db.profile.get(1)
  if (profile) {
    globalProfile.value = {
      ...profile,
      unit: profile.unit || 'kg'
    }
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
    avatar: '',
    unit: 'kg'
  }
  await db.profile.put({ ...blankProfile, id: 1 })
  globalProfile.value = blankProfile
}

export const getUnitLabel = () => {
  return globalProfile.value.unit === 'jin' ? '斤' : 'kg'
}

export const formatWeight = (weightKg: number | string | undefined | null): string => {
  if (weightKg === undefined || weightKg === null || weightKg === '' || isNaN(Number(weightKg))) {
    return '——'
  }
  const num = Number(weightKg)
  const val = globalProfile.value.unit === 'jin' ? num * 2 : num
  return Number(val.toFixed(1)).toString()
}

export const toKgWeight = (inputWeight: number | string): number => {
  const num = Number(inputWeight)
  if (isNaN(num)) return 0
  const kgVal = globalProfile.value.unit === 'jin' ? num / 2 : num
  return Number(kgVal.toFixed(2))
}

export const getRecords = async (): Promise<RecordItem[]> => {
  const records = await db.records.toArray()
  return records.sort((a, b) => newTypeDateSort(b.date, a.date))
}

// 辅助排序小函数
const newTypeDateSort = (dateA: string, dateB: string) => {
  return new Date(dateA).getTime() - new Date(dateB).getTime()
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