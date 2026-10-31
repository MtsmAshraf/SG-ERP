"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string | null
  read: boolean
  createdAt: string
  actor?: { name: string } | null
}

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
}

// Global state to share across all dropdown instances
let globalState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false
}

let globalListeners: Array<(state: NotificationsState) => void> = []
let pollingInterval: NodeJS.Timeout | null = null
let isFetching = false

function notifyListeners() {
  globalListeners.forEach(listener => listener(globalState))
}

async function fetchNotifications() {
  if (isFetching) return // Prevent concurrent requests
  
  isFetching = true
  globalState = { ...globalState, isLoading: true }
  notifyListeners()
  
  try {
    const res = await fetch("/api/notifications", {
      cache: "no-store" // Prevent caching
    })
    
    if (res.ok) {
      const data = await res.json()
      globalState = {
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        isLoading: false
      }
    }
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    globalState = { ...globalState, isLoading: false }
  } finally {
    isFetching = false
    notifyListeners()
  }
}

function startPolling() {
  if (pollingInterval) return // Already polling
  
  fetchNotifications() // Initial fetch
  
  pollingInterval = setInterval(() => {
    // Only poll if document is visible
    if (!document.hidden) {
      fetchNotifications()
    }
  }, 30000) // 30 seconds
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

export function useNotifications() {
  const [state, setState] = useState<NotificationsState>(globalState)
  const mountedRef = useRef(true)
  
  useEffect(() => {
    mountedRef.current = true
    
    // Subscribe to global state changes
    const listener = (newState: NotificationsState) => {
      if (mountedRef.current) {
        setState(newState)
      }
    }
    
    globalListeners.push(listener)
    
    // Start polling if not already running
    startPolling()
    
    // Handle visibility change to pause/resume polling
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications() // Fetch immediately when tab becomes visible
      }
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange)
    
    return () => {
      mountedRef.current = false
      globalListeners = globalListeners.filter(l => l !== listener)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      
      // Stop polling if no more listeners
      if (globalListeners.length === 0) {
        stopPolling()
      }
    }
  }, [])
  
  const refetch = useCallback(() => {
    fetchNotifications()
  }, [])
  
  return { ...state, refetch }
}