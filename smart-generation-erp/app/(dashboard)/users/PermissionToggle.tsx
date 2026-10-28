"use client"

interface PermissionToggleProps {
  name: string
  label: string
  description?: string
  defaultChecked: boolean
  disabled?: boolean
}

export function PermissionToggle({ name, label, description, defaultChecked, disabled }: PermissionToggleProps) {
  return (
    <label className={`flex items-start gap-3 rounded-lg border p-3 transition ${
      disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : "bg-white hover:border-blue-300 cursor-pointer"
    }`}>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        )}
      </div>
    </label>
  )
}