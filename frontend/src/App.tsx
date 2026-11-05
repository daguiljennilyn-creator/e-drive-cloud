import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/ProtectedRoute'
import { PageLoader } from './components/ui/Spinner'
import { Dashboard } from './pages/Dashboard'
import { ActivityPage } from './pages/activity/ActivityPage'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { SignIn } from './pages/auth/SignIn'
import { SignUp } from './pages/auth/SignUp'
import { CredentialsPage } from './pages/credentials/CredentialsPage'
import { DocumentFormPage } from './pages/documents/DocumentFormPage'
import { DocumentsPage } from './pages/documents/DocumentsPage'
import { PrivacyPage, TermsPage } from './pages/legal/LegalPages'
import { NotFoundPage } from './pages/NotFoundPage'
import { NotificationsPage } from './pages/notifications/NotificationsPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { PublicSharePage } from './pages/share/PublicSharePage'
import { DevicesSettings } from './pages/settings/DevicesSettings'
import { GeneralSettings } from './pages/settings/GeneralSettings'
import { NotificationSettings } from './pages/settings/NotificationSettings'
import { PrivacySettings } from './pages/settings/PrivacySettings'
import { SecuritySettings } from './pages/settings/SecuritySettings'
import { SettingsLayout } from './pages/settings/SettingsLayout'
import { StorageSettings } from './pages/settings/StorageSettings'
import { TrashPage } from './pages/trash/TrashPage'
import { UpgradePage } from './pages/upgrade/UpgradePage'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <PageLoader label="Opening E-Drive…" />
      </div>
    )
  }
  return <Navigate to={user ? '/dashboard' : '/signin'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

            <Route element={<PublicOnlyRoute />}>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            <Route path="/share/:token" element={<PublicSharePage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/documents" element={<DocumentsPage mode="all" />} />
                <Route path="/certificates" element={<DocumentsPage mode="certificates" />} />
                <Route path="/personal-files" element={<DocumentsPage mode="personal" />} />
                <Route path="/documents/new" element={<DocumentFormPage />} />
                <Route path="/documents/:id/edit" element={<DocumentFormPage />} />
                <Route path="/credentials" element={<CredentialsPage />} />
                <Route path="/trash" element={<TrashPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/upgrade" element={<UpgradePage />} />

                <Route path="/settings" element={<SettingsLayout />}>
                  <Route index element={<GeneralSettings />} />
                  <Route path="security" element={<SecuritySettings />} />
                  <Route path="notifications" element={<NotificationSettings />} />
                  <Route path="devices" element={<DevicesSettings />} />
                  <Route path="storage" element={<StorageSettings />} />
                  <Route path="privacy" element={<PrivacySettings />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
