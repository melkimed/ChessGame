/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 */

// Fix pour sockjs-client et autres bibliothèques qui utilisent 'global'
(window as any).global = window;

// Import SockJS pour le rendre disponible globalement
import * as SockJS from 'sockjs-client';
(window as any).SockJS = SockJS;