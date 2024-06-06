import Icon from 'g45-react/components/fontawesome_icon'
import { css } from 'goober'
import { createContext, useCallback, useContext, useState } from 'react'
import store from 'store2'

import { slideX } from '../style/animate'

const storeNotifications = store.namespace(`notifications`)

const Context = createContext(null)

const defaultStyle = {
  container: css`
    position: absolute;
    right: 0;
    top: 0;
    display: flex;
    gap: 1em;
    padding: 1em;
    flex-direction: column;
    z-index: 1;
    /*background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, .1) 100%);*/
  `,
  notification: css`
    background: var(--bg-color);
    padding: 1em;
    border-radius: .5em;
    width: 15em;
    color: var(--text-color);
    ${slideX({ from: `100%`, to: `0%`, duration: `0.1s` })}
  `,
  header: css`
    display: flex;
    gap: 1em;
    justify-content: space-between;
    margin-bottom: .5em;
    align-items: center;
  `,
  title: css`
    display: flex;
    gap: .5em;
    align-items: center;
  `,
  closeButton: css`
    color: var(--text-color);
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1.1em;
  `,
  description: css`
    color: var(--muted-color);
  `
}

export const NotificationProvider = (props) => {
  const { children, styling = defaultStyle } = props

  const [notifications, setNotifications] = useState(() => {
    const data = storeNotifications.getAll()
    return Object.values(data)
  })

  const pushNotification = useCallback((notification, options = { timeout: 3000, store: false }) => {
    const key = Date.now()
    const newNotification = { key, ...notification }
    setNotifications((notifications) => {
      return [newNotification, ...notifications]
    })

    if (options.store) {
      storeNotifications.add(key, newNotification)
    }

    if (options.timeout) {
      setTimeout(() => {
        deleteNotification(key)
      }, [options.timeout])
    }
  }, [])

  const deleteNotification = useCallback((key) => {
    setNotifications((notifications) => notifications.filter((notification) => {
      return notification.key !== key
    }))
    storeNotifications.remove(key)
  }, [])

  return <Context.Provider value={{ pushNotification, deleteNotification }}>
    {children}
    <div className={styling.container}>
      {notifications.map((notification) => {
        const { key, icon, title, description } = notification
        return <div key={key} className={styling.notification}>
          <div className={styling.header}>
            <div className={styling.title}>
              {icon && <Icon name={icon} />}
              <div>{title}</div>
            </div>
            <button onClick={() => deleteNotification(key)} className={styling.closeButton}>
              <Icon name="close" />
            </button>
          </div>
          <div className={styling.description}>
            {description}
          </div>
        </div>
      })}
    </div>
  </Context.Provider>
}

export const useNotification = () => useContext(Context)

