import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Zap, Info } from 'lucide-react'

/**
 * Show success toast notification
 */
export const showSuccessToast = (message, description = '') => {
  toast.success(message, {
    description,
    icon: <CheckCircle2 className="w-5 h-5" />,
  })
}

/**
 * Show error toast notification
 */
export const showErrorToast = (message, description = '') => {
  toast.error(message, {
    description,
    icon: <AlertCircle className="w-5 h-5" />,
  })
}

/**
 * Show warning toast notification
 */
export const showWarningToast = (message, description = '') => {
  toast.warning(message, {
    description,
    icon: <Zap className="w-5 h-5" />,
  })
}

/**
 * Show info toast notification
 */
export const showInfoToast = (message, description = '') => {
  toast.info(message, {
    description,
    icon: <Info className="w-5 h-5" />,
  })
}

/**
 * Show loading toast that can be updated
 */
export const showLoadingToast = (message, id = 'loading-toast') => {
  return toast.loading(message, {
    id,
  })
}

/**
 * Update a loading toast to success
 */
export const updateToastSuccess = (id, message, description = '') => {
  toast.success(message, {
    id,
    description,
    icon: <CheckCircle2 className="w-5 h-5" />,
  })
}

/**
 * Update a loading toast to error
 */
export const updateToastError = (id, message, description = '') => {
  toast.error(message, {
    id,
    description,
    icon: <AlertCircle className="w-5 h-5" />,
  })
}
