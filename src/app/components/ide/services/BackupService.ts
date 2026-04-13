/**
 * @file: BackupService.ts
 * @description: YYC³ 数据备份服务 - 定期自动备份、多版本管理、备份恢复
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-08
 * @updated: 2026-04-08
 * @status: production
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: backup,restore,versioning,automation
 */

import { getDB } from '../adapters/IndexedDBAdapter'
import { STORAGE_PREFIXES } from '../constants/storage-keys'

export interface BackupMetadata {
  id: string
  version: string
  createdAt: number
  size: number
  type: 'auto' | 'manual'
  description?: string
  metadata: {
    userAgent: string
    screenResolution: string
    language: string
    localStorageCount: number
    indexedDBFiles: number
    indexedDBProjects: number
    indexedDBSnapshots: number
  }
}

export interface BackupData {
  metadata: BackupMetadata
  localStorage: Record<string, string>
  indexedDB: {
    files: any[]
    projects: any[]
    snapshots: any[]
  }
}

export interface BackupConfig {
  enabled: boolean
  interval: number
  maxBackups: number
  autoBackupOnExit: boolean
  compressBackups: boolean
}

export interface BackupInfo {
  id: string
  createdAt: number
  size: string
  type: 'auto' | 'manual'
  description?: string
}

const BACKUP_STORE = 'backups'
const BACKUP_CONFIG_KEY = 'yyc3-backup-config'
const DEFAULT_CONFIG: BackupConfig = {
  enabled: true,
  interval: 3600000,
  maxBackups: 10,
  autoBackupOnExit: true,
  compressBackups: false,
}

export class BackupService {
  private static instance: BackupService
  private config: BackupConfig
  private autoBackupTimer: ReturnType<typeof setInterval> | null = null

  private constructor() {
    this.config = this.loadConfig()
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService()
    }
    return BackupService.instance
  }

  private loadConfig(): BackupConfig {
    try {
      const stored = localStorage.getItem(BACKUP_CONFIG_KEY)
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.warn('[BackupService] Failed to load config:', e)
    }
    return DEFAULT_CONFIG
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(BACKUP_CONFIG_KEY, JSON.stringify(this.config))
    } catch (e) {
      console.error('[BackupService] Failed to save config:', e)
    }
  }

  getConfig(): BackupConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()

    if (newConfig.enabled !== undefined || newConfig.interval !== undefined) {
      this.stopAutoBackup()
      if (this.config.enabled) {
        this.startAutoBackup()
      }
    }
  }

  async createBackup(type: 'auto' | 'manual' = 'manual', description?: string): Promise<string> {
    const id = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const backupData: BackupData = {
      metadata: {
        id,
        version: '1.0',
        createdAt: now,
        size: 0,
        type,
        description,
        metadata: {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          language: navigator.language,
          localStorageCount: 0,
          indexedDBFiles: 0,
          indexedDBProjects: 0,
          indexedDBSnapshots: 0,
        },
      },
      localStorage: {},
      indexedDB: {
        files: [],
        projects: [],
        snapshots: [],
      },
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && STORAGE_PREFIXES.some((p) => key.startsWith(p))) {
        const value = localStorage.getItem(key)
        if (value) {
          backupData.localStorage[key] = value
        }
      }
    }
    backupData.metadata.metadata.localStorageCount = Object.keys(backupData.localStorage).length

    try {
      const db = await getDB()
      backupData.indexedDB.files = await db.getAll('files')
      backupData.indexedDB.projects = await db.getAll('projects')
      backupData.indexedDB.snapshots = await db.getAll('snapshots')

      backupData.metadata.metadata.indexedDBFiles = backupData.indexedDB.files.length
      backupData.metadata.metadata.indexedDBProjects = backupData.indexedDB.projects.length
      backupData.metadata.metadata.indexedDBSnapshots = backupData.indexedDB.snapshots.length
    } catch (e) {
      console.warn('[BackupService] Failed to backup IndexedDB:', e)
    }

    const backupString = JSON.stringify(backupData)
    backupData.metadata.size = new Blob([backupString]).size

    try {
      const db = await getDB()
      if (!db.objectStoreNames.contains(BACKUP_STORE)) {
        console.warn('[BackupService] Backup store not found, skipping save')
        return id
      }
      await db.put(BACKUP_STORE, backupData)
      console.log(`[BackupService] Backup created: ${id}`)

      await this.cleanupOldBackups()

      return id
    } catch (e) {
      console.error('[BackupService] Failed to save backup:', e)
      throw e
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    try {
      const db = await getDB()
      if (!db.objectStoreNames.contains(BACKUP_STORE)) {
        return []
      }
      const backups = await db.getAll(BACKUP_STORE) as BackupData[]

      return backups
        .map((backup) => ({
          id: backup.metadata.id,
          createdAt: backup.metadata.createdAt,
          size: this.formatSize(backup.metadata.size),
          type: backup.metadata.type,
          description: backup.metadata.description,
        }))
        .sort((a, b) => b.createdAt - a.createdAt)
    } catch (e) {
      console.error('[BackupService] Failed to list backups:', e)
      return []
    }
  }

  async getBackup(id: string): Promise<BackupData | null> {
    try {
      const db = await getDB()
      if (!db.objectStoreNames.contains(BACKUP_STORE)) {
        return null
      }
      const backup = await db.get(BACKUP_STORE, id)
      return backup || null
    } catch (e) {
      console.error('[BackupService] Failed to get backup:', e)
      return null
    }
  }

  async restoreBackup(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const backup = await this.getBackup(id)
      if (!backup) {
        return { success: false, message: '备份不存在' }
      }

      const keysToPreserve = ['yyc3-theme', BACKUP_CONFIG_KEY]
      const allKeys = Object.keys(localStorage)
      allKeys.forEach((key) => {
        if (key.startsWith('yyc3-') && !keysToPreserve.includes(key)) {
          localStorage.removeItem(key)
        }
      })

      Object.entries(backup.localStorage).forEach(([key, value]) => {
        localStorage.setItem(key, value)
      })

      try {
        const db = await getDB()
        await db.clear('files')
        await db.clear('projects')
        await db.clear('snapshots')

        for (const file of backup.indexedDB.files) {
          await db.put('files', file)
        }
        for (const project of backup.indexedDB.projects) {
          await db.put('projects', project)
        }
        for (const snapshot of backup.indexedDB.snapshots) {
          await db.put('snapshots', snapshot)
        }
      } catch (e) {
        console.error('[BackupService] Failed to restore IndexedDB:', e)
        return { success: false, message: 'IndexedDB 恢复失败' }
      }

      console.log(`[BackupService] Backup restored: ${id}`)
      return { success: true, message: '备份恢复成功' }
    } catch (e) {
      console.error('[BackupService] Failed to restore backup:', e)
      return { success: false, message: `恢复失败: ${(e as Error).message}` }
    }
  }

  async deleteBackup(id: string): Promise<boolean> {
    try {
      const db = await getDB()
      if (!db.objectStoreNames.contains(BACKUP_STORE)) {
        return false
      }
      await db.delete(BACKUP_STORE, id)
      console.log(`[BackupService] Backup deleted: ${id}`)
      return true
    } catch (e) {
      console.error('[BackupService] Failed to delete backup:', e)
      return false
    }
  }

  async exportBackup(id: string): Promise<void> {
    const backup = await this.getBackup(id)
    if (!backup) {
      throw new Error('备份不存在')
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yyc3-backup-${new Date(backup.metadata.createdAt).toISOString().split('T')[0]}-${id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async importBackup(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string
          const backup = JSON.parse(text) as BackupData

          if (!backup.metadata || !backup.localStorage || !backup.indexedDB) {
            throw new Error('无效的备份文件格式')
          }

          backup.metadata.id = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          backup.metadata.type = 'manual'
          backup.metadata.description = '导入的备份'

          const db = await getDB()
          if (!db.objectStoreNames.contains(BACKUP_STORE)) {
            throw new Error('备份存储不可用')
          }
          await db.put(BACKUP_STORE, backup)

          console.log(`[BackupService] Backup imported: ${backup.metadata.id}`)
          resolve(backup.metadata.id)
        } catch (e) {
          reject(new Error(`导入失败: ${(e as Error).message}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsText(file)
    })
  }

  private async cleanupOldBackups(): Promise<void> {
    const backups = await this.listBackups()
    if (backups.length > this.config.maxBackups) {
      const toDelete = backups.slice(this.config.maxBackups)
      for (const backup of toDelete) {
        await this.deleteBackup(backup.id)
      }
      console.log(`[BackupService] Cleaned up ${toDelete.length} old backups`)
    }
  }

  startAutoBackup(): void {
    if (this.autoBackupTimer) {
      this.stopAutoBackup()
    }

    if (this.config.enabled && this.config.interval > 0) {
      this.autoBackupTimer = setInterval(async () => {
        try {
          await this.createBackup('auto', '自动备份')
          console.log('[BackupService] Auto backup completed')
        } catch (e) {
          console.error('[BackupService] Auto backup failed:', e)
        }
      }, this.config.interval)

      console.log(`[BackupService] Auto backup started (interval: ${this.config.interval}ms)`)
    }
  }

  stopAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer)
      this.autoBackupTimer = null
      console.log('[BackupService] Auto backup stopped')
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  async getBackupStats(): Promise<{
    total: number
    autoCount: number
    manualCount: number
    totalSize: number
    oldestBackup: number | null
    newestBackup: number | null
  }> {
    const backups = await this.listBackups()

    return {
      total: backups.length,
      autoCount: backups.filter((b) => b.type === 'auto').length,
      manualCount: backups.filter((b) => b.type === 'manual').length,
      totalSize: backups.reduce((sum, b) => {
        const size = parseFloat(b.size.split(' ')[0])
        const unit = b.size.split(' ')[1]
        const bytes =
          unit === 'MB' ? size * 1024 * 1024 : unit === 'KB' ? size * 1024 : size
        return sum + bytes
      }, 0),
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : null,
      newestBackup: backups.length > 0 ? backups[0].createdAt : null,
    }
  }
}

export default BackupService
