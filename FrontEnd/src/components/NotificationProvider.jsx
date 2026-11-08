import { useCallback, useEffect, useState } from "react";
import {
  FaCheck,
  FaExclamation,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";
import { NotificationContext } from "./NotificationContext";
import "./NotificationProvider.css";

const notificationTypes = {
  success: { Icon: FaCheck, label: "Success" },
  error: { Icon: FaExclamation, label: "Error" },
  warning: { Icon: FaExclamationTriangle, label: "Warning" },
  info: { Icon: FaInfoCircle, label: "Information" },
};

function NotificationCard({ notification, onDismiss }) {
  const { Icon, label } = notificationTypes[notification.type];

  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(notification.id), 5000);
    return () => window.clearTimeout(timeout);
  }, [notification.id, onDismiss]);

  return (
    <article
      className={`app-toast app-toast--${notification.type}`}
      role={notification.type === "error" ? "alert" : "status"}
      aria-live={notification.type === "error" ? "assertive" : "polite"}
    >
      <span className="app-toast__icon" aria-hidden="true">
        <Icon />
      </span>
      <div className="app-toast__body">
        <strong className="app-toast__title">{notification.title || label}</strong>
        <p className="app-toast__message">{notification.message}</p>
      </div>
      <button
        className="app-toast__close"
        type="button"
        onClick={() => onDismiss(notification.id)}
        aria-label="Dismiss notification"
      >
        <FaTimes aria-hidden="true" />
      </button>
      <span className="app-toast__progress" aria-hidden="true" />
    </article>
  );
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const dismiss = useCallback((id) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const notify = useCallback(({ title, message, type = "info" }) => {
    if (!notificationTypes[type]) {
      throw new Error(`Unsupported notification type: ${type}`);
    }

    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setNotifications((current) => [...current, { id, title, message, type }]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div className="app-toast-region" aria-label="Notifications">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
