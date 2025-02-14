// src/services/NotificationService.js
export class NotificationService {
    showNotification(message, isUpdate = false, isError = false, subtitle = '') {
        const notification = document.createElement('div');
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const iconPath = isDarkMode ? '/images/icon16-dark.png' : '/images/icon16.png';
        const extensionURL = chrome.runtime.getURL(iconPath);

        const baseStyles = {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px',
            backgroundColor: isError ? '#FFF3F3' : (isDarkMode ? '#2A2A2A' : 'white'),
            color: isError ? '#CF4848' : (isDarkMode ? '#E4E4E4' : '#2C3E50'),
            borderRadius: '12px',
            zIndex: '2147483647',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: isDarkMode ?
                '0 4px 12px rgba(0, 0, 0, 0.3)' :
                '0 4px 12px rgba(0, 0, 0, 0.08)',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            opacity: '0',
            transform: 'translateY(-8px)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '400px',
            border: isError ?
                '1px solid rgba(207, 72, 72, 0.2)' :
                `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
            WebkitFontSmoothing: 'antialiased'
        };

        Object.assign(notification.style, baseStyles);
        notification.innerHTML = this._getNotificationHTML(extensionURL, message, subtitle, isDarkMode, isError);
        
        this._addNotificationStyles();
        document.body.appendChild(notification);
        
        // Fade in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        return this._setupNotificationBehavior(notification);
    }

    _getNotificationHTML(extensionURL, message, subtitle, isDarkMode, isError) {
        return `
            <img src="${extensionURL}" alt="Horizon" style="
                width: 24px;
                height: 24px;
                margin: 4px;
                ${isError ? 'filter: grayscale(100%) brightness(70%)' : ''}
            ">
            <div style="flex: 1;">
                <h2 style="
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: ${isError ? '#CF4848' : (isDarkMode ? '#E4E4E4' : '#2C3E50')};
                    line-height: 1.4;
                ">${message}</h2>
                ${subtitle ? `
                    <p style="
                        margin: 2px 0 0 0;
                        font-size: 12px;
                        color: ${isDarkMode ? '#999' : '#666'};
                        line-height: 1.4;
                    ">${subtitle}</p>
                ` : ''}
            </div>
            <button class="notification-close" style="
                background: none;
                border: none;
                padding: 4px;
                cursor: pointer;
                opacity: 0.5;
                color: ${isDarkMode ? '#E4E4E4' : '#2C3E50'};
                transition: opacity 0.2s ease;
                position: absolute;
                top: 8px;
                right: 8px;
            ">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="notification-progress" style="
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
                border-radius: 0 0 12px 12px;
                overflow: hidden;
            ">
                <div class="progress-bar" style="
                    height: 100%;
                    width: 100%;
                    background: ${isDarkMode ? '#4A9EFF' : '#2196F3'};
                    transform-origin: left;
                    animation: notificationProgress 3s linear forwards;
                "></div>
            </div>
        `;
    }

    _addNotificationStyles() {
        if (!document.getElementById('horizon-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'horizon-notification-styles';
            style.textContent = `
                @keyframes notificationProgress {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }

                .notification-close:hover {
                    opacity: 1 !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    _setupNotificationBehavior(notification) {
        let timeoutId;
        let isPaused = false;

        // Add hover handlers
        notification.addEventListener('mouseenter', () => {
            isPaused = true;
            const progressBar = notification.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.animationPlayState = 'paused';
            }
            clearTimeout(timeoutId);
        });

        notification.addEventListener('mouseleave', () => {
            isPaused = false;
            const progressBar = notification.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.animationPlayState = 'running';
            }
            startCloseTimer();
        });

        // Add close button handler
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => this._removeNotification(notification));

        // Function to start the close timer
        const startCloseTimer = () => {
            timeoutId = setTimeout(() => {
                if (!isPaused) {
                    this._removeNotification(notification);
                }
            }, 3000);
        };

        // Start the initial timer
        startCloseTimer();

        return notification;
    }

    _removeNotification(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-8px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}