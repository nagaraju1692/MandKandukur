import React from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Language, t } from '../i18n'

type ProfileContext = {
  language: Language
  user: { name: string; phone: string } | null
  favorites: string[]
  logout: () => void
  openLoginModal: () => void
}

export default function Profile() {
  const { language, user, favorites, logout, openLoginModal } = useOutletContext<ProfileContext>()
  const navigate = useNavigate()
  const displayName = user?.name || 'Guest user'
  const activityItems = [
    { icon: '★', label: 'My reviews', value: '0', action: () => {} },
    { icon: '♥', label: 'My favorites', value: String(favorites.length), action: () => navigate('/favorites') },
    { icon: '⌖', label: 'Recently viewed', value: '', action: () => navigate('/categories') },
  ]

  return (
    <div className="profile-screen">
      <header className="account-header">
        <div>
          <p>Account</p>
          <h2>{t('profile', language)}</h2>
        </div>
        <button type="button" className="account-settings" aria-label="Profile settings">⚙</button>
      </header>

      <section className="account-summary">
        <div className="account-avatar">{displayName.charAt(0).toUpperCase()}</div>
        <div>
          <h3>{displayName}</h3>
          <p>{user ? user.phone : 'Login to save favorites and manage your list'}</p>
          {user && <p className="account-location">⌖ Kandukur, Andhra Pradesh</p>}
        </div>
      </section>

      {user ? (
        <>
          <section className="account-section">
            <h3>My activity</h3>
            <div className="account-list">
              {activityItems.map((item) => (
                <button type="button" className="account-list-row" key={item.label} onClick={item.action}>
                  <span className="account-row-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.value && <small>{item.value}</small>}
                  <b aria-hidden="true">›</b>
                </button>
              ))}
            </div>
          </section>

          <section className="account-section">
            <h3>More</h3>
            <div className="account-list">
              <button type="button" className="account-list-row" onClick={() => navigate('/categories')}><span className="account-row-icon">＋</span><span>Submit a business</span><b>›</b></button>
              <button type="button" className="account-list-row" onClick={() => navigate('/')}><span className="account-row-icon">i</span><span>About Mana Kandukur</span><b>›</b></button>
              <button type="button" className="account-list-row" onClick={() => navigate('/')}><span className="account-row-icon">?</span><span>Help & support</span><b>›</b></button>
              <button type="button" className="account-list-row danger" onClick={logout}><span className="account-row-icon">↪</span><span>Logout</span><b>›</b></button>
            </div>
          </section>
        </>
      ) : (
        <section className="guest-prompt">
          <span className="guest-prompt-icon">✦</span>
          <h3>Keep your local list handy</h3>
          <p>Save favorites and access them from any visit.</p>
          <button type="button" className="account-login-button" onClick={openLoginModal}>Continue</button>
        </section>
      )}
    </div>
  )
}
